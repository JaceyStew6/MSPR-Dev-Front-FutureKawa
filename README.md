# Installation Guide — FutureKawa Frontend

> **Audience:** Developers, DevOps engineers, and technical contributors.  
> **Repository:** [github.com/JaceyStew6/MSPR-Dev-Front-FutureKawa](https://github.com/JaceyStew6/MSPR-Dev-Front-FutureKawa)

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Project Structure](#3-project-structure)
4. [Prerequisites](#4-prerequisites)
5. [Local Development Setup](#5-local-development-setup)
6. [Environment Variables](#6-environment-variables)
7. [Mock Mode (no backend)](#7-mock-mode-no-backend)
8. [Available Scripts](#8-available-scripts)
9. [Code Quality Tooling](#9-code-quality-tooling)
10. [Running Tests](#10-running-tests)
11. [Docker & Production Build](#11-docker--production-build)
12. [SonarQube](#12-sonarqube)
13. [Backend API Contract](#13-backend-api-contract)

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`) | `^3.5` |
| Build Tool | [Vite](https://vite.dev/) | `^8.0` |
| Language | TypeScript | `~6.0` |
| State Management | [Pinia](https://pinia.vuejs.org/) | `^3.0` |
| Routing | [Vue Router](https://router.vuejs.org/) | `^5.0` |
| Charting | [Chart.js](https://www.chartjs.org/) | `^4.4` |
| Testing | [Vitest](https://vitest.dev/) + [@vue/test-utils](https://test-utils.vuejs.org/) | `^4.1` |
| Linting | [ESLint](https://eslint.org/) + [oxlint](https://oxc.rs/docs/guide/usage/linter) | `^10` / `~1.60` |
| Formatting | [Prettier](https://prettier.io/) | `3.8` |
| Type checking | vue-tsc | `^3.2` |
| Container | Docker (multi-stage) + nginx | alpine |
| Code Quality | SonarQube Community | `9000` |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / Client                     │
│                                                             │
│   Vue 3 SPA (Vite build → nginx static serve)              │
│   ┌───────────┐  ┌────────────┐  ┌──────────────────────┐  │
│   │ Vue Router│  │   Pinia    │  │  Chart.js components │  │
│   │  (RBAC)   │  │  stores    │  │  (readings, KPIs)    │  │
│   └───────────┘  └────────────┘  └──────────────────────┘  │
│          │               │                                  │
│   ┌──────▼───────────────▼──────────────────────────────┐  │
│   │                  services/api.ts                     │  │
│   │   Bearer JWT · fetch wrapper · 401 auto-logout       │  │
│   └──────────────────────────────┬──────────────────────┘  │
└─────────────────────────────────-│──────────────────────────┘
                                   │  HTTP / REST
                    ┌──────────────▼──────────────────┐
                    │   nginx reverse proxy (Docker)   │
                    │   /api-siege/ → backend:8082     │
                    └──────────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
     ┌────────▼──────┐   ┌────────▼──────┐   ┌────────▼──────┐
     │  Siège API    │   │  Brazil API   │   │  Colombia API │
     │  :8082        │   │  :8080        │   │  :8083        │
     └───────────────┘   └───────────────┘   └───────────────┘
```

### Key Design Decisions

- **Role-Based Access Control (RBAC):** enforced at the router level via `router.beforeEach`. Each route has an allowlist of roles defined in `ROLE_ACCESS` (`src/router/index.ts`). Unauthorized navigation silently redirects to `/dashboard`.
- **Auto-scoped data:** on login, `auth.store.ts` enriches the user object with their `farm_id` and `warehouse_ids` by calling the geo API. All service calls use `autoFilters` (from the store) to automatically constrain queries to the user's country/farm/warehouse.
- **Multi-backend architecture:** the application targets a distributed backend with one API per country. The Vite dev server and nginx proxy both expose a single `/api-siege` entry point that routes to the appropriate backend.
- **Mock mode:** a full in-memory mock layer (`src/mocks/`) intercepts all `fetch` calls when `VITE_MOCK=true`, enabling full frontend development without any backend running.

---

## 3. Project Structure

```
src/
├── assets/           # Static CSS (base.css, main.css) and SVG logo
├── components/
│   ├── charts/       # ReadingChart.vue — Chart.js temperature/humidity graph
│   └── common/       # Shared UI: AppNav, AlertBadge, LotTable, CascadeFilter,
│                     #            Pagination, StatusBadge, ThresholdDot
├── config/
│   └── routes.ts     # Role → default redirect map (ROLE_DEFAULT_ROUTES)
├── mocks/
│   ├── data.ts       # Static fixture data (lots, alerts, users, warehouses…)
│   └── handlers.ts   # Mock fetch router — maps URL patterns to fixture data
├── router/
│   └── index.ts      # Vue Router setup + RBAC navigation guard
├── services/
│   ├── api.ts        # Base fetch wrapper (auth header, 401 handling, mock toggle)
│   ├── auth.service.ts
│   ├── alerts.service.ts
│   ├── geo.service.ts
│   ├── lots.service.ts
│   ├── movements.service.ts
│   ├── readings.service.ts
│   ├── reporting.service.ts
│   └── status-overrides.ts   # Local overrides for lot status (localStorage)
├── stores/
│   ├── auth.store.ts          # User session, role, auto-filters
│   ├── alerts.store.ts        # Alert polling (30 s interval), unread count
│   └── filters.store.ts       # Cascade filter state (country/farm/warehouse/zone)
├── types/            # TypeScript interfaces: Lot, Alert, Movement, Reading…
├── views/
│   ├── LoginView.vue
│   ├── DashboardView.vue
│   ├── alerts/AlertsView.vue
│   ├── lots/LotListView.vue
│   ├── lots/LotDetailView.vue
│   ├── monitoring/MonitoringView.vue
│   └── roles/
│       ├── farm/FarmView.vue · CreateLotView.vue
│       ├── warehouse/WarehouseView.vue · MovementsView.vue
│       ├── quality/QualityView.vue
│       ├── supply-chain/SupplyChainView.vue
│       └── hq/HQView.vue
├── App.vue           # Root component — mounts AppNav + RouterView
└── main.ts           # App bootstrap: Vue, Pinia, Router, MSW (mock)
```

---

## 4. Prerequisites

| Tool | Minimum version | Notes |
|---|---|---|
| Node.js | **22.12.0** (or 20.19.0 LTS) | Enforced via `engines` field in `package.json` |
| npm | 10+ | Bundled with Node 22 |
| Git | Any recent | — |
| Docker + Docker Compose | 24+ | Required only for production / SonarQube |

> **Tip:** use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to switch Node versions easily.

---

## 5. Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/JaceyStew6/MSPR-Dev-Front-FutureKawa.git
cd MSPR-Dev-Front-FutureKawa

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — see Section 6

# 4. Start the dev server
npm run dev
```

The app is available at **http://localhost:5173** by default.

Hot Module Replacement (HMR) is enabled — changes to `.vue` and `.ts` files are reflected instantly without a full reload.

---

## 6. Environment Variables

All variables are prefixed with `VITE_` and exposed to the browser at build time.

| Variable | Default | Description |
|---|---|---|
| `VITE_MOCK` | `false` | Set to `true` to enable the in-memory mock layer (no backend required) |
| `VITE_API_BASE_URL` | `/api-siege` | Base URL for all API requests. In dev, proxied by Vite to the backend |
| `VITE_SIEGE_URL` | `http://localhost:8082` | Centralised read API (used in `.env.example`) |
| `VITE_BRESIL_URL` | `http://localhost:8080` | Brazil backend |
| `VITE_EQUATEUR_URL` | `http://localhost:8081` | Ecuador backend |
| `VITE_COLOMBIE_URL` | `http://localhost:8083` | Colombia backend |

**Typical `.env` for development with a local backend:**

```env
VITE_MOCK=false
VITE_API_BASE_URL=/api-siege
```

The Vite dev server proxies `/api-siege` to `http://localhost:8082` (configured in `vite.config.ts`):

```ts
server: {
  proxy: {
    '/api-siege': {
      target: 'http://localhost:8082',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api-siege/, ''),
    },
  },
},
```

> **Never commit `.env`** — it is listed in `.gitignore`. Only `.env.example` should be versioned.

---

## 7. Mock Mode (no backend)

Set `VITE_MOCK=true` in your `.env` to run the entire application without any backend.

```env
VITE_MOCK=true
VITE_API_BASE_URL=/api-siege
```

All `fetch` calls are intercepted by `src/mocks/handlers.ts`, which routes requests to static fixtures in `src/mocks/data.ts`.

**Pre-configured mock users:**

| Email | Password | Role |
|---|---|---|
| `farm@futurekawa.com` | `test` | Farm Manager |
| `warehouse@futurekawa.com` | `test` | Warehouse Manager |
| `quality@futurekawa.com` | `test` | Quality Team |
| `supply@futurekawa.com` | `test` | Supply Chain |
| `hq@futurekawa.com` | `test` | HQ |

> **Note:** the `auth` endpoints (`/auth/login`, `/auth/logout`, `/auth/me`) are **always mocked**, regardless of `VITE_MOCK`, because the backend does not expose an authentication API.

---

## 8. Available Scripts

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Start Vite dev server with HMR on port 5173 |
| Type check | `npm run type-check` | Run `vue-tsc --build` (no emit) |
| Build | `npm run build` | Type-check + production bundle in `dist/` |
| Build only | `npm run build-only` | Production bundle without type check |
| Preview | `npm run preview` | Serve the `dist/` folder locally |
| Unit tests | `npm run test:unit` | Run Vitest in watch mode |
| Lint | `npm run lint` | Run oxlint then ESLint (both with `--fix`) |
| Format | `npm run format` | Run Prettier on `src/` |

---

## 9. Code Quality Tooling

### Prettier

Configured in `.prettierrc.json`:

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100
}
```

### ESLint + oxlint

Two-stage linting pipeline (`lint:oxlint` → `lint:eslint`):

- **oxlint** handles fast, low-level correctness rules (configured in `.oxlintrc.json`)
- **ESLint** applies Vue-specific and TypeScript rules on top

Both are run with `--fix` — the majority of issues are auto-corrected.

### EditorConfig

`.editorconfig` enforces consistent formatting across editors:

- Indent: 2 spaces
- End of line: LF
- Charset: UTF-8
- Max line length: 100

---

## 10. Running Tests

```bash
# Run tests once
npx vitest run

# Run in watch mode (recommended during development)
npm run test:unit

# Run with coverage report
npx vitest run --coverage
```

Coverage is generated in `coverage/` using the V8 provider. Reports are output in three formats: `lcov`, `text` (console), and `html`.

The lcov report (`coverage/lcov.info`) is the one consumed by SonarQube.

**Test environment:** jsdom (browser-like DOM emulation via Vitest's `environment: 'jsdom'` config).

---

## 11. Docker & Production Build

### Build the image

```bash
docker build -t futurekawa-frontend .
```

The `Dockerfile` is a two-stage build:

1. **Stage 1 (builder):** Node 22 Alpine — installs dependencies and runs `npm run build-only`, producing the `dist/` folder.
2. **Stage 2 (serve):** nginx Alpine — copies `dist/` and the custom `nginx.conf`, listens on port 80.

### nginx proxy

`nginx.conf` forwards `/api-siege/` requests to the backend (`host.docker.internal:8082` by default) and serves the SPA with HTML5 history mode (`try_files $uri $uri/ /index.html`).

### Docker Compose (with SonarQube)

```bash
# Start all services (app + SonarQube + PostgreSQL for Sonar)
docker compose up -d

# Check status
docker compose ps
```

| Service | URL | Description |
|---|---|---|
| `app` | http://localhost:3000 | Vue.js SPA served by nginx |
| `sonarqube` | http://localhost:9000 | SonarQube (default login: `admin` / `admin`) |
| `sonar-db` | — | PostgreSQL for SonarQube (internal only) |

> **Linux users:** you may need to increase `vm.max_map_count` for SonarQube:  
> `sudo sysctl -w vm.max_map_count=524288`

---

## 12. SonarQube

Static analysis is configured in `sonar-project.properties`.

**Key settings:**

| Property | Value |
|---|---|
| `sonar.projectKey` | `futurekawa-frontend` |
| `sonar.sources` | `src/` |
| `sonar.javascript.lcov.reportPaths` | `coverage/lcov.info` |
| `sonar.qualitygate.wait` | `true` — scanner fails if the Quality Gate is not passed |

**Running the scanner locally:**

```bash
# 1. Generate coverage first
npx vitest run --coverage

# 2. Run the scanner (requires SONAR_TOKEN or admin credentials)
docker run --rm \
  -e SONAR_HOST_URL=http://localhost:9000 \
  -e SONAR_TOKEN=<your_token> \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli
```

---

## 13. Backend API Contract

The frontend expects a REST API that follows these conventions:

- **Auth:** `POST /auth/login` → `{ token, user }` — always mocked client-side
- **Bearer token:** all authenticated requests send `Authorization: Bearer <token>`
- **Pagination:** responses for list endpoints follow `{ data: T[], total: number, page: number, limit: number }`
- **Error format:** `{ message: string }` with appropriate HTTP status code

Key API paths used by the frontend:

| Path | Method | Description |
|---|---|---|
| `/auth/login` | POST | Authenticate user |
| `/auth/logout` | POST | Invalidate session |
| `/auth/me` | GET | Get current user |
| `/lots` | GET | List lots (filterable) |
| `/lots/:id` | GET | Get lot detail |
| `/countries` | GET | List countries |
| `/farms/:pays` | GET | List farms for a country |
| `/warehouses` | GET | List warehouses |
| `/zones/:warehouseId` | GET | List zones |
| `/movements` | GET | List movements |
| `/alerts` | GET | List alerts |
| `/readings/warehouse/:id/summary` | GET | IoT live summary |
| `/reporting/global` | GET | Global KPIs |
| `/reporting/stock` | GET | Stock KPIs |
| `/reporting/quality` | GET | Quality KPIs |
