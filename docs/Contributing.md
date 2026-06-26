# Contributing to FutureKawa Frontend

Thank you for contributing to FutureKawa. This document defines the rules and conventions that **all contributors must follow** to keep the codebase clean, the history readable, and the review process smooth.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Branch Strategy](#2-branch-strategy)
3. [Commit Conventions](#3-commit-conventions)
4. [Pull Requests](#4-pull-requests)
5. [Code Quality Checklist](#5-code-quality-checklist)
6. [Do's and Don'ts](#6-dos-and-donts)

---

## 1. Getting Started

Before contributing:

1. **Fork** or **clone** the repository.
2. Follow the [Installation Guide](../Installation-guide.md) to set up your local environment.
3. Make sure all tests pass before you start:
   ```bash
   npm run type-check
   npm run test:unit
   ```
4. Work on a dedicated branch - never commit directly to `main`.

---

## 2. Branch Strategy

### Base branches

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready code. Protected - no direct push. |
| `feat/*` | New features |
| `fix/*` | Bug fixes |
| `chore/*` | Tooling, dependencies, config changes |
| `docs/*` | Documentation only |
| `refactor/*` | Code refactoring without functional change |
| `test/*` | Adding or updating tests |

### Branch naming convention

```
<type>/<ticket-name>-<short-description>
```

- **`<type>`** - one of: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- **`<ticket-name>`** - the ticket/issue identifier (e.g. `fk-42`, `mspr-07`)
- **`<short-description>`** - lowercase, hyphen-separated, concise

#### Examples

```bash
feat/fk-42-lot-creation-form
fix/fk-17-fifo-filter-wrong-cutoff
chore/mspr-03-upgrade-vite-8
docs/fk-01-installation-guide
refactor/fk-55-auth-store-cleanup
test/fk-60-quality-view-unit-tests
```

> **Rules:**
> - All lowercase, no spaces, no underscores
> - Keep the description short (3-5 words max)
> - Always include the ticket identifier - no ticket, no branch

---

## 3. Commit Conventions

This project uses **[Conventional Commits](https://www.conventionalcommits.org/)**.

### Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature visible to the user |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, missing semicolons - no logic change |
| `refactor` | Code restructuring - no feature or bug fix |
| `test` | Adding or correcting tests |
| `chore` | Build, tooling, dependencies, CI config |
| `perf` | Performance improvement |
| `revert` | Reverting a previous commit |

### Scope

The scope is the area of the codebase affected. Use short, consistent names:

| Scope | Covers |
|---|---|
| `auth` | Login, auth store, token management |
| `lots` | Lot list, lot detail, lot service |
| `alerts` | Alerts view, alerts store, alerts service |
| `monitoring` | IoT monitoring view, readings service |
| `farm` | Farm view, create-lot view |
| `warehouse` | Warehouse view, movements view |
| `quality` | Quality view, traceability export |
| `supply-chain` | Supply chain view |
| `hq` | HQ / global reporting view |
| `router` | Route definitions, navigation guards |
| `store` | Pinia stores (non-auth) |
| `api` | `services/api.ts`, base fetch wrapper |
| `mock` | Mock handlers and fixture data |
| `ui` | Shared components (AppNav, LotTable…) |
| `config` | Vite, ESLint, Prettier, TypeScript config |
| `ci` | CI/CD pipeline, SonarQube |
| `deps` | Dependency updates |

### Examples

```bash
# Feature
feat(lots): add cascade filter by zone

# Bug fix
fix(monitoring): prevent zone card from rendering without a reading

# Refactor
refactor(auth): extract enrichment logic into separate functions

# Chore
chore(deps): upgrade vue-router to 5.0.4

# Documentation
docs(api): document mock fetch router path matching

# Test
test(quality): add unit tests for traceability export

# Breaking change (add ! and footer)
feat(router)!: restrict /monitoring to warehouse_manager and quality roles

BREAKING CHANGE: supply_chain users can no longer access /monitoring
```

### Rules

- Use the **imperative mood** in the description: "add", "fix", "remove", "update" - not "added", "fixing"
- Keep the first line **under 72 characters**
- Do not end the description with a period
- Separate the body from the header with a blank line
- Reference the ticket in the footer: `Refs: FK-42` or `Closes: FK-42`

---

## 4. Pull Requests

### Naming convention

```
<type>(<ticket-name>): <short description>
```

This mirrors the commit convention and makes the PR list easy to scan.

#### Examples

```
feat(fk-42): lot creation form with farm auto-selection
fix(fk-17): correct FIFO cutoff date calculation
chore(mspr-03): upgrade Vite to v8
docs(fk-01): add installation guide and contributing guide
refactor(fk-55): simplify auth store user enrichment
test(fk-60): unit tests for quality view export
```

### PR checklist

Before requesting a review, verify that:

- [ ] The branch is up to date with `main` (`git rebase main` or `git merge main`)
- [ ] All CI checks pass: type-check, lint, tests
- [ ] New features are covered by unit tests
- [ ] No `console.log`, commented-out code, or debug code left in
- [ ] Environment variables are documented in `.env.example` if added
- [ ] The PR description explains **what** was changed and **why**
- [ ] The linked ticket / issue is referenced in the PR description

### PR description template

```markdown
## What

<!-- One or two sentences describing the change. -->

## Why

<!-- Context, motivation, or link to the ticket. -->

## How

<!-- Notable implementation decisions, trade-offs, or things reviewers should focus on. -->

## Testing

<!-- How was this tested? Unit tests? Manual steps? Mock mode? -->

## Related

Closes #<issue-number> / Refs: <TICKET-ID>
```

### Review process

- **At least one approving review** is required before merging.
- Resolve all comments before merging.
- Use **squash merge** for feature branches to keep `main` history clean.
- Delete the branch after merge.

---

## 5. Code Quality Checklist

Before pushing any commit, run:

```bash
npm run type-check   # TypeScript - zero errors required
npm run format       # Prettier
npm run test:unit    # All tests must pass
```

SonarQube runs on every PR in CI. The Quality Gate **must pass** before merging.

### Style guidelines

- Use `<script setup lang="ts">` for all Vue components.
- Prefer `computed()` over `watch()` where possible.
- Keep components focused - split into sub-components if a file exceeds ~200 lines.
- Services call the API; components call services via stores. Do not call `api.*` directly from components.
- Type everything - avoid `any`. Use the types defined in `src/types/`.
- Import path alias `@/` instead of relative paths for anything outside the current directory.

---

## 6. Do's and Don'ts

| ✅ Do | ❌ Don't |
|---|---|
| Work on a dedicated branch per ticket | Commit directly to `main` |
| Write conventional commit messages | Write vague messages like `fix stuff` or `WIP` |
| Keep commits atomic (one logical change) | Bundle unrelated changes in one commit |
| Write or update unit tests for new logic | Submit features without test coverage |
| Reference the ticket in commits and PRs | Open a PR without a linked ticket |
| Rebase on `main` before opening a PR | Merge `main` into your branch without rebasing |
| Keep the PR focused on one concern | Mix features, fixes, and refactors in one PR |
| Use `VITE_MOCK=true` for frontend-only work | Connect to a shared staging backend for local dev |

---

*For questions, open a discussion on the repository.*
