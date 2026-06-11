# Plan 006: CI GitHub Actions — type-check, test e format check su ogni push/PR

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 622c4d8..HEAD -- package.json turbo.json vitest.config.ts .nvmrc`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (più utile dopo il Plan 001, ma funziona anche prima)
- **Category**: dx
- **Planned at**: commit `622c4d8`, 2026-06-11

## Why this matters

Il repo non ha nessuna CI (`.github/workflows` non esiste): type-check e test girano
solo se qualcuno se ne ricorda in locale. Una regressione nei 15+ test PGlite o un
errore di tipo può arrivare su `main` senza che nessuno se ne accorga. Era già la
Priorità 6 di `.workflow/PLAN-NEXT.md` ("GitHub Actions con type-check + pnpm
test:run su PR"). Una pipeline minima e affidabile vale più di una completa e flaky:
questo piano cabla solo i passi che oggi passano in locale senza variabili d'ambiente.

## Current state

- Monorepo pnpm 10 + turborepo. Da `package.json` root:
  - `"packageManager": "pnpm@10.11.0"` (usato da `pnpm/action-setup` per la versione)
  - script: `type-check` (turbo, esclude `@desko/web` congelata), `test:run`
    (vitest root, PGlite — **nessuna variabile d'ambiente richiesta**: i test mockano
    `@desko/db` e `@desko/auth/server`), `format:check` (prettier), `lint` (turbo →
    `next lint`).
- `.nvmrc` → `24`.
- I task turbo `type-check`/`lint` hanno `dependsOn: ["^build"]`, ma i packages non
  hanno script `build` (entry `src/index.ts` diretti) quindi turbo non builda nulla.
- **`pnpm build` NON è CI-safe oggi**: il build Next di web-shadcn importa
  `@desko/env`, che valida le variabili (DATABASE_URL, BETTER_AUTH_SECRET, …) a
  import-time. Niente build in questa pipeline (vedi Maintenance notes).
- **`pnpm lint` non è incluso**: `next lint` è in via di rimozione in Next 16 e non è
  stato verificato headless. Non aggiungerlo in questo piano.
- Non esiste alcuna directory `.github/`.

## Commands you will need

| Purpose      | Command              | Expected on success |
|--------------|----------------------|---------------------|
| Install      | `pnpm install`       | exit 0              |
| Typecheck    | `pnpm type-check`    | exit 0              |
| Tests        | `pnpm test:run`      | tutti verdi         |
| Format check | `pnpm format:check`  | exit 0              |

Prima di scrivere il workflow, esegui i tre comandi di verifica in locale: se uno
fallisce GIÀ ORA, è una STOP condition (la CI nascerebbe rossa).

## Scope

**In scope**:
- `.github/workflows/ci.yml` (create)

**Out di scope**:
- `pnpm build` in CI (richiede env: decisione del maintainer su secrets/dummy env).
- `pnpm lint` in CI (next lint non verificato; rivalutare con ESLint standalone).
- Deploy, release, e2e, badge nel README.
- Qualunque modifica a script o config esistenti.

## Git workflow

- Branch: `chore/ci-github-actions`
- Commit singolo; stile: `chore(ci): GitHub Actions con type-check + test + format`
- Non pushare né aprire PR se non richiesto.

## Steps

### Step 1: Creare il workflow

Crea `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        # versione letta da "packageManager" in package.json

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Type-check
        run: pnpm type-check

      - name: Test (Vitest + PGlite)
        run: pnpm test:run

      - name: Format check
        run: pnpm format:check
```

**Verify**: `npx --yes yaml-lint .github/workflows/ci.yml` (o un parse YAML
equivalente, es. `node -e "require('js-yaml')..."`; se nessun linter YAML è
disponibile, verifica la sintassi con attenzione manuale) → nessun errore.

### Step 2: Verifica locale dei passi della pipeline

Esegui in sequenza, dalla root:

```sh
pnpm install --frozen-lockfile && pnpm type-check && pnpm test:run && pnpm format:check
```

**Verify**: exit 0 complessivo. Se `format:check` fallisce per file preesistenti non
formattati, NON eseguire `pnpm format` di tua iniziativa: riporta l'elenco dei file
nel report finale e rimuovi lo step "Format check" dal workflow, annotandolo.

## Test plan

La pipeline stessa è il test: al primo push su un branch, il job `verify` deve
risultare verde su GitHub. In locale, lo Step 2 replica esattamente i comandi.

## Done criteria

- [ ] `.github/workflows/ci.yml` esiste e il YAML è valido
- [ ] La sequenza dello Step 2 esce con 0 in locale
- [ ] Nessun altro file modificato (`git status`)
- [ ] Riga di stato aggiornata in `plans/README.md`

## STOP conditions

- Uno dei tre comandi fallisce in locale al commit di partenza (la causa va risolta
  nei piani relativi, non qui).
- Il repo non ha un remote GitHub configurato (`git remote -v` vuoto o non-GitHub):
  scrivi comunque il file, ma segnala che non è verificabile end-to-end.

## Maintenance notes

- Quando `@desko/env` avrà un modo CI-safe di validare (es. `SKIP_ENV_VALIDATION` o
  defaults di test), aggiungere uno step `pnpm build` — oggi fallirebbe per env
  mancanti a import-time.
- Quando arriveranno i Playwright e2e (PLAN-NEXT P6), farne un job separato (più
  lento e flaky del job verify, non deve bloccarlo).
- PGlite scarica il WASM da node_modules (nessuna rete a runtime): se i tempi del job
  crescono, aggiungere la cache turbo (`.turbo`) — per ora inutile.
