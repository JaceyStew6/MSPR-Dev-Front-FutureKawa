# Guide : Intégration SonarQube + GitHub Actions (FutureKawa Frontend)

## Fichiers créés/modifiés par ce guide

| Fichier | Rôle |
|---|---|
| `docker-compose.yml` | Lance SonarQube + PostgreSQL + App en une commande |
| `sonar-project.properties` | Config de l'analyse SonarQube |
| `.github/workflows/ci.yml` | Pipeline CI/CD multi-jobs GitHub Actions |
| `vite.config.ts` | Ajout de la config coverage Vitest |
| `Dockerfile` | `npm run build-only` (sans vue-tsc) pour éviter les erreurs TS |

---

## Étape 1 - Démarrer tous les services avec Docker Compose

```bash
docker compose up -d
```

Cela lance en même temps :
- `sonar-db` → PostgreSQL sur le réseau interne
- `sonarqube` → SonarQube Community sur **http://localhost:9000**
- `app` → L'application Vue.js (build nginx) sur **http://localhost:3000**

**Vérifier que tout est up :**
```bash
docker compose ps
docker compose logs -f sonarqube   # attendre "SonarQube is operational"
```

> **Note Windows / Docker Desktop** : `vm.max_map_count` est automatiquement géré.
> Sur Linux natif il faudrait ajouter `sysctl -w vm.max_map_count=524288`.

**Différence GitLab CI** : Dans GitLab, SonarQube tourne souvent sur un serveur dédié
accessible depuis Internet. Ici il est local, d'où le besoin d'un self-hosted runner.

---

## Étape 2 - Créer le projet dans SonarQube et générer un token

1. Ouvrir **http://localhost:9000**
2. Se connecter (admin / admin par défaut → changer au premier login)
3. **Créer un projet** :
   - Cliquer sur **"Create Project" > "Manually"** (pas "Import from GitHub" : GitHub ne peut pas envoyer de webhook vers localhost)
   - Project display name : `FutureKawa Frontend`
   - Project key : `futurekawa-frontend` ← doit correspondre à `sonar.projectKey` dans `sonar-project.properties`
   - Branch : `main`
   - Quality Gate : "Follows the instance's default" (Sonar way)
4. **Générer un token** :
   - Dans la page d'analyse du projet → **"Set up" > "With GitHub Actions"**
   - OU via **Mon compte > Security > Generate Token**
   - Type : **Project Analysis Token**
   - Nom : `github-actions-futurekawa`
   - Expiration : selon la politique appliquée
   - **Copier le token immédiatement** (affiché une seule fois)

**Différence GitLab CI** :
- GitLab → le token se pose dans **Settings > CI/CD > Variables** (masqué)
- GitHub → le token se pose dans **Settings > Secrets and variables > Actions > New repository secret**

---

## Étape 3 - Configurer les secrets GitHub Actions

Dans le repo GitHub :
**Settings > Secrets and variables > Actions > New repository secret**

| Secret | Valeur |
|---|---|
| `SONAR_TOKEN` | Le token généré à l'étape 2 |
| `SONAR_HOST_URL` | `http://localhost:9000` |

> **Note** : `SONAR_HOST_URL` est conservé comme référence dans les secrets mais
> le step Docker utilise `http://host.docker.internal:9000` directement dans le workflow
> (voir Étape 6). `localhost` dans un conteneur Docker pointe vers le conteneur lui-même,
> pas vers la machine hôte.

**Différence GitLab CI** :
```
# GitLab CI : variables CI/CD dans l'UI ou dans .gitlab-ci.yml
variables:
  SONAR_TOKEN: $SONAR_TOKEN
  SONAR_HOST_URL: $SONAR_HOST_URL
```
```yaml
# GitHub Actions : secrets injectés via env dans le step
env:
  SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

---

## Étape 4 - Configurer la Server Base URL de SonarQube

Sans cette config, le lien affiché dans les logs du scanner pointe vers
`host.docker.internal:9000` (l'URL interne Docker) au lieu de `localhost:9000`.

**http://localhost:9000 → Administration → Configuration → General Settings**

Chercher **"Server base URL"** et définir :
```
http://localhost:9000
```

Sauvegarder. Les liens dans les rapports du scanner utilisent désormais `localhost:9000`.

---

## Étape 5 - Installer le self-hosted runner GitHub Actions

Les runners hébergés GitHub (`ubuntu-latest`, `windows-latest`) sont des VMs
isolées sur l'infrastructure GitHub : ils **ne peuvent pas joindre** le
`localhost:9000`. Un **self-hosted runner** est un processus qui tourne sur
la machine utilisateur et qui exécute les jobs à la place.

**Équivalent GitLab CI** : `gitlab-runner register --tags self-hosted` → `tags: [local]`.
Dans GitHub Actions : `runs-on: self-hosted`.

### Installation sur Windows 10/11

1. Dans le repo GitHub : **Settings > Actions > Runners > New self-hosted runner**
2. Sélectionner **Windows** (x64)
3. Suivre les commandes affichées. En résumé dans PowerShell (Admin) :

```powershell
mkdir C:\actions-runner
cd C:\actions-runner

# Télécharger (copier la commande exacte depuis GitHub, la version change)
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.x.x/actions-runner-win-x64-2.x.x.zip -OutFile actions-runner-win-x64.zip

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD\actions-runner-win-x64.zip", "$PWD")

# Configurer (copier la commande exacte depuis GitHub, elle contient le token)
.\config.cmd --url https://github.com/NOM_ORG/NOM_REPO --token AAAA...

# Répondre aux questions :
#   runner group : laisser vide (Default)
#   runner name  : futurekawa-runner
#   work folder  : laisser _work
#   run as service : No (voir note ci-dessous)
```

### Lancer le runner

> **Note** : `svc.cmd` (service Windows) peut échouer avec le compte NETWORK SERVICE
> sur certaines machines. La solution de contournement fiable est de lancer `run.cmd`
> directement en arrière-plan via PowerShell :

```powershell
Start-Process -FilePath "C:\actions-runner\run.cmd" -WindowStyle Hidden
```

Le runner apparaît en **Idle** dans **Settings > Actions > Runners** du repo.
Pour l'arrêter : fermer le processus `Runner.Listener` dans le gestionnaire des tâches.

### Utiliser le runner dans le workflow

```yaml
runs-on: self-hosted
```

**Différence GitLab CI** :
```yaml
# GitLab CI : tag sur le runner
job:
  tags:
    - local
```
```yaml
# GitHub Actions : runs-on suffit
runs-on: self-hosted
# Avec labels custom :
runs-on: [self-hosted, windows, futurekawa]
```

---

## Étape 6 - Vérifier la config Vitest coverage

Le fichier `vite.config.ts` a été mis à jour avec :

```typescript
test: {
  globals: true,
  environment: 'jsdom',
  coverage: {
    provider: 'v8',
    reporter: ['lcov', 'text', 'html'],
    reportsDirectory: './coverage',
    include: ['src/**/*.{ts,vue}'],
    exclude: ['src/main.ts', 'src/**/*.d.ts', 'src/assets/**'],
  },
},
```

**Installer le provider v8** (si pas déjà présent) :
```bash
npm install --save-dev @vitest/coverage-v8
```

**Tester localement** :
```bash
npm run test:unit -- --coverage
# → génère coverage/lcov.info
```

`coverage/lcov.info` est lu par SonarQube via `sonar-project.properties` :
```
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

---

## Étape 7 - Pipeline CI/CD multi-jobs (.github/workflows/ci.yml)

### Pourquoi ne pas utiliser l'action officielle `sonarsource/sonarqube-scan-action` ?

L'action officielle exécute un script bash (`sanity-checks.sh`) via `bash.EXE` (WSL).
Sur Windows sans WSL installé, cela provoque :
```
WSL ERROR: CreateProcessEntryCommon: execvpe /bin/bash failed
Error: Process completed with exit code 1.
```

**Solution retenue** : utiliser directement l'image Docker `sonarsource/sonar-scanner-cli`
dans un step `shell: cmd`. Docker est déjà présent sur la machine (utilisé pour SonarQube).

> **Note** : `pwsh` (PowerShell Core 7) n'est pas non plus disponible par défaut sur
> Windows 10. Utiliser `shell: powershell` (Windows PowerShell 5) ou `shell: cmd`.

### Structure du pipeline

```
build ──► test ┐
               ├──► sonar ──► deploy (main uniquement)
          lint ┘
```

| Job | Équivalent GitLab | Détail |
|---|---|---|
| `build` | `stage: build` | `npm run build-only` + upload `dist/` |
| `test` | `stage: test → unit-test-job` | Vitest + coverage, `continue-on-error` |
| `lint` | `stage: test → lint-test-job` | oxlint + ESLint (actuellement desactivé) |
| `sonar` | `stage: sonar` | Scanner Docker + rapports JSON |
| `deploy` | `stage: deploy` | main uniquement, placeholder |

**Passage d'artifacts entre jobs** :

GitLab permet aux jobs d'un même pipeline d'accéder aux artifacts des jobs précédents
via `dependencies:`. GitHub Actions requiert un `upload-artifact` explicite puis un
`download-artifact` dans le job suivant :

```yaml
# Job test → upload
- uses: actions/upload-artifact@v4
  with:
    name: coverage-${{ github.run_id }}
    path: coverage/

# Job sonar → download
- uses: actions/download-artifact@v4
  with:
    name: coverage-${{ github.run_id }}
    path: coverage/
```

**Pourquoi `host.docker.internal` dans le step Docker ?**

```yaml
- name: Analyse SonarQube + Quality Gate
  shell: cmd
  run: |
    docker run --rm ^
      -e SONAR_TOKEN=${{ secrets.SONAR_TOKEN }} ^
      -e SONAR_HOST_URL=http://host.docker.internal:9000 ^
      -v "%GITHUB_WORKSPACE%:/usr/src" ^
      sonarsource/sonar-scanner-cli:latest
```

Depuis l'intérieur d'un conteneur Docker sur Windows/macOS, `localhost` pointe vers
le conteneur lui-même. `host.docker.internal` est résolu automatiquement par Docker
Desktop et pointe vers la machine hôte, où SonarQube écoute sur le port 9000.

**Récupération des rapports après analyse** (`if: always()` = équivalent de `when: always` GitLab) :

```yaml
- name: Récupération du rapport Quality Gate
  if: always()
  shell: cmd
  run: >
    curl -s
    -u "${{ secrets.SONAR_TOKEN }}:"
    "http://localhost:9000/api/qualitygates/project_status?projectKey=futurekawa-frontend"
    -o sonar-report.json
```

Les fichiers `sonar-report.json` et `sonar-issues.json` sont uploadés comme artifacts
(7 jours de rétention), accessibles dans l'onglet **Actions > run > Artifacts** du repo.

---

## Étape 8 - Déclencher le pipeline

```bash
git add .
git commit -m "feat: add CI/CD pipeline with SonarQube"
git push origin main
```

Le pipeline se déclenche automatiquement, visible dans l'onglet **Actions** du repo GitHub.

**Vérifier le résultat dans SonarQube :**

Ouvrir **http://localhost:9000/dashboard?id=futurekawa-frontend**

---

## Étape 9 - Tester un cas Quality Gate en ÉCHEC

Pour vérifier que le pipeline **bloque vraiment** quand la Quality Gate échoue :

### Méthode 1 : Abaisser le seuil de coverage

1. **http://localhost:9000** > **Quality Gates** > **Sonar way** (ou créer une gate custom)
2. Ajouter une condition : **Coverage on New Code < 80%**
3. Assigner cette Quality Gate au projet FutureKawa
4. Pousser → le job `sonar` doit échouer avec :
   ```
   ERROR: QUALITY GATE STATUS: FAILED - View details on http://localhost:9000/dashboard?id=futurekawa-frontend
   ```

### Méthode 2 : Introduire une duplication délibérée

Copier-coller un bloc de code dans plusieurs fichiers pour déclencher
la règle "Duplicated Lines (%)" de la Quality Gate.

### Ce qu'on voit dans GitHub Actions si la QG échoue

```
INFO: QUALITY GATE STATUS: FAILED
ERROR: QUALITY GATE STATUS: FAILED
Error: Process completed with exit code 1.
```

Le job `sonar` passe en rouge → le job `deploy` est automatiquement bloqué.
Si des **branch protection rules** sont configurées sur `main`
(Settings > Branches > Require status checks), la PR ne peut pas être mergée.

---

## Tableau récapitulatif GitLab CI vs GitHub Actions

| Concept | GitLab CI | GitHub Actions |
|---|---|---|
| Fichier de config | `.gitlab-ci.yml` | `.github/workflows/ci.yml` |
| Unité d'exécution | job | step dans un job |
| Ordonnancement | `stages` | `needs:` entre jobs |
| Jobs en parallèle | même `stage:` | même niveau de `needs:` |
| Secrets | Settings > CI/CD > Variables | Settings > Secrets > Actions |
| Runner self-hosted | `tags: [local]` | `runs-on: self-hosted` |
| Image Docker (scanner) | `image: sonarsource/sonar-scanner-cli` | `docker run` dans `shell: cmd` |
| Checkout auto | oui | non → `actions/checkout@v4` |
| Déclencheurs | `only/except` ou `rules` | `on: push/pull_request` |
| Artifacts entre jobs | `dependencies:` (automatique) | `upload-artifact` + `download-artifact` |
| Upload si échec | `artifacts: when: always` | `if: always()` sur le step |
| Variables env | `$VARIABLE` | `${{ secrets.VARIABLE }}` |
| Condition de branche | `if: $CI_COMMIT_BRANCH == 'main'` | `if: github.ref_name == 'main'` |
| Environnement de deploy | `environment: production` | `environment: production` |
| Blocage de merge | pipeline rouge + MR check | status check requis (branch protection) |
