# Guide : Intégration SonarQube + GitHub Actions (FutureKawa Frontend)

## Fichiers créés/modifiés par ce guide

| Fichier | Rôle |
|---|---|
| `docker-compose.yml` | Lance SonarQube + PostgreSQL + App en une commande |
| `sonar-project.properties` | Config de l'analyse SonarQube |
| `.github/workflows/sonar.yml` | Workflow GitHub Actions |
| `vite.config.ts` | Ajout de la config coverage Vitest |

---

## Étape 1 - Démarrer tous les services avec Docker Compose

```bash
docker compose up -d
```

Cela lance **en même temps** :
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
   - Cliquer sur **"Create Project" > "Manually"**
   - Project display name : `FutureKawa Frontend`
   - Project key : `futurekawa-frontend` ← doit correspondre à `sonar.projectKey` dans `sonar-project.properties`
   - Branch : `main`
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

> **Pourquoi `http://localhost:9000` fonctionne ici** : le workflow tourne sur le
> **self-hosted runner** installé sur la machine Windows. 
> `localhost` depuis ce runner pointe bien vers le Docker Desktop.

**Différence GitLab CI** :
```
# GitLab CI : variables CI/CD dans l'UI ou dans .gitlab-ci.yml
variables:
  SONAR_TOKEN: $SONAR_TOKEN          # variable masquée dans l'UI
  SONAR_HOST_URL: $SONAR_HOST_URL
```
```yaml
# GitHub Actions : secrets injectés via env dans le step
env:
  SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

---

## Étape 4 - Installer le self-hosted runner GitHub Actions

Les runners hébergés GitHub (`ubuntu-latest`, `windows-latest`) sont des VMs
isolées sur l'infrastructure GitHub : ils **ne peuvent pas joindre** le
`localhost:9000`. Un **self-hosted runner** est un processus qui tourne sur
la machine utilisateur et qui exécute les jobs à la place.

**Équivalent GitLab CI** : dans GitLab, un GitLab Runner self-hosted est
enregistré avec `gitlab-runner register --tags self-hosted`. Dans GitHub
Actions c'est `runs-on: self-hosted`.

### Installation sur Windows 11

1. Dans le repo GitHub : **Settings > Actions > Runners > New self-hosted runner**
2. Sélectionner **Windows** (x64)
3. Suivre les commandes affichées. En résumé dans PowerShell (Admin) :

```powershell
# Créer le dossier du runner
mkdir C:\actions-runner ; cd C:\actions-runner

# Télécharger (adapter la version affichée dans GitHub)
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.x.x/actions-runner-win-x64-2.x.x.zip -OutFile actions-runner-win-x64.zip

# Dézipper
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD\actions-runner-win-x64.zip", "$PWD")

# Configurer (copier la commande exacte depuis GitHub, elle contient le token)
.\config.cmd --url https://github.com/NOM_ORG/NOM_REPO --token AAAA...

# Répondre aux questions :
#   runner group : laisser vide (Default)
#   runner name  : futurekawa-runner 
#   work folder  : laisser _work
```

### Lancer le runner en arrière-plan (service Windows)

```powershell
# Installer comme service Windows (s'exécute même sans session ouverte)
.\svc.cmd install
.\svc.cmd start

# Vérifier le statut
.\svc.cmd status
```

Le runner apparaît en vert dans **Settings > Actions > Runners** du repo.

### Utiliser le runner dans le workflow

Dans `.github/workflows/sonar.yml` :
```yaml
runs-on: self-hosted
```

**Différence GitLab CI** :
```yaml
# GitLab CI : tag sur le runner
job:
  tags:
    - self-hosted   # le runner doit avoir été enregistré avec ce tag
```
```yaml
# GitHub Actions : runs-on suffit pour un runner self-hosted sans label custom
runs-on: self-hosted
# Avec labels custom :
runs-on: [self-hosted, windows, futurekawa]
```

---

## Étape 5 - Vérifier la config Vitest coverage

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

`coverage/lcov.info` est le fichier lu par SonarQube via :
```
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

---

## Étape 6 - Tester le workflow complet

### Déclencher le workflow

```bash
git add .
git commit -m "feat: add SonarQube CI integration"
git push origin main
```

Le workflow se déclenche, visible dans **Actions** du repo GitHub.

### Vérifier le résultat dans SonarQube

Ouvrir **http://localhost:9000/dashboard?id=futurekawa-frontend**

---

## Étape 7 - Tester un cas Quality Gate en ÉCHEC

Pour vérifier que le pipeline **bloque vraiment** quand la Quality Gate échoue :

### Méthode 1 : Abaisser le seuil de coverage dans SonarQube

1. **http://localhost:9000** > **Quality Gates** > **Sonar way** (ou créer une gate custom)
2. Ajouter une condition : **Coverage on New Code < 80%**
3. Assigner cette Quality Gate au projet FutureKawa
4. Supprimer des tests ou réduire la coverage sous 80%
5. Pousser → le job `sonarqube` doit échouer avec :
   ```
   ERROR: QUALITY GATE STATUS: FAILED
   ```

### Méthode 2 : Introduire un bug délibéré de duplication

Copier-coller un bloc de code dans plusieurs fichiers pour déclencher
la règle "Duplicated Lines (%)" de la Quality Gate.

### Ce qu'on voit dans GitHub Actions si la QG échoue

```
Run sonarsource/sonarqube-quality-gate-action@v1
  Quality Gate status: FAILED
  Error: Quality Gate failed
```

Le job passe en rouge et si des **branch protection rules** sont
configurées sur `main` (Settings > Branches > Require status checks),
la PR **ne peut pas être mergée**.

---

## Tableau récapitulatif GitLab CI vs GitHub Actions

| Concept | GitLab CI | GitHub Actions |
|---|---|---|
| Fichier de config | `.gitlab-ci.yml` | `.github/workflows/*.yml` |
| Unité d'exécution | job | step dans un job |
| Secrets | Settings > CI/CD > Variables | Settings > Secrets > Actions |
| Runner self-hosted | `tags: [tag]` | `runs-on: self-hosted` ou label |
| Images Docker | `image: node:22` | `runs-on: ubuntu-latest` + setup-node |
| Checkout auto | oui | non → `actions/checkout@v4` |
| Déclencheurs | `only/except` ou `rules` | `on: push/pull_request` |
| Artefacts | `artifacts: paths:` | `actions/upload-artifact` |
| Cache | `cache: paths:` | `actions/cache` ou cache dans setup-node |
| Variables env | `$VARIABLE` | `${{ secrets.VARIABLE }}` ou `${{ env.VAR }}` |
| Blocage de merge | pipeline rouge + merge request check | status check requis sur branch protection |
