# Plan 007: README.md e CLAUDE.md alla root — onboarding per umani e agenti

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 622c4d8..HEAD -- package.json pnpm-workspace.yaml .workflow/meta.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. (Drift qui significa solo: aggiorna i
> contenuti dei documenti ai fatti correnti.)

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `622c4d8`, 2026-06-11

## Why this matters

Il repo non ha né `README.md` né `CLAUDE.md` alla root: un clone fresco (umano o
agente) deve dedurre da `package.json` e dai commit come si avvia il web, come si
avvia il mobile, quali env servono, dove vive la business logic e qual è il pattern di
test. Visto che questo progetto viene sviluppato in larga parte da agenti (gli stessi
piani in `plans/` lo presuppongono), la mappa del codebase è leva diretta sulla
qualità di ogni sessione futura.

## Current state — i fatti da mettere nei documenti

Verifica ognuno di questi fatti prima di scriverlo (i comandi per farlo sono nei file
citati); al commit 622c4d8 sono:

- **Prodotto**: Desko — presenza in ufficio per una azienda su due piani a Milano:
  chi c'è oggi/quando, dichiarazione giornaliera e settimanale, piani (7° stanza, 2°
  co-working), proposte pranzo, privacy GDPR (visibilità company/team/followers/hidden),
  admin con ruoli e analytics HR k-anonime. Documenti prodotto in `.workflow/`
  (PROJECT.md, PRD.md con le user stories US-1..US-8, DESIGN.md, PLAN-NEXT.md).
- **Monorepo**: pnpm 10 + turborepo, Node ≥20 (`.nvmrc`: 24). Workspace:
  `apps/*` + `packages/*` (`pnpm-workspace.yaml`).
- **Apps**:
  - `apps/web-shadcn` — **app canonica**. Next.js 16 App Router, React 19,
    Tailwind 4, componenti da `@desko/ui`, TanStack Form. Porta dev **3020**
    (`pnpm --filter @desko/web-shadcn dev`).
  - `apps/mobile` — Expo SDK 56 (RN 0.85), expo-router, NativeWind 4 (Tailwind 3),
    TanStack Query, better-auth client Expo + SecureStore. Parla col web via REST
    `/api/*` (`EXPO_PUBLIC_API_URL`). `pnpm --filter @desko/mobile dev`.
  - `apps/web` — port MUI **CONGELATO** (vedi `apps/web/FROZEN.md`), escluso da
    build/lint/type-check root. Non toccare.
- **Packages** (un rigo ciascuno nel README):
  - `@desko/domain` — tipi puri e costanti (Floor, PresenceStatus, ActionResult).
  - `@desko/services` — business logic pura (Zod + Drizzle), prende `userId`/`Viewer`
    come parametro, MAI la sessione. Il file principale è `src/presence.ts`.
  - `@desko/server-actions` — adapter Next: sessione → servizio → `revalidatePath`.
  - `@desko/queries` — adapter di lettura (presence, lunch, hr-analytics).
  - `@desko/db` — Drizzle + Neon serverless; schema, migrazioni
    (`pnpm --filter @desko/db migrate`), seed, e `./testing` (PGlite per i test).
  - `@desko/auth` — better-auth (email+password, Microsoft Entra, plugin admin, Expo).
  - `@desko/email` — Resend + template react-email.
  - `@desko/env` — validazione env (a import-time!).
  - `@desko/ui`, `@desko/design-tokens` — componenti shadcn-style e token.
- **Comandi root**: `pnpm dev` / `build` / `lint` / `type-check` (tutti escludono
  `@desko/web`), `pnpm test` / `test:run` (vitest + PGlite, nessuna env richiesta),
  `pnpm format` / `format:check`.
- **Setup env**: copia `apps/web-shadcn/.env.example` → `.env` (DATABASE_URL Neon,
  better-auth, Microsoft Entra, Resend); mobile: `apps/mobile/.env.example`
  (`EXPO_PUBLIC_API_URL`, in locale `http://localhost:3020`). Non citare MAI valori
  reali.
- **Architettura del flusso presence** (per CLAUDE.md):
  `UI (web page/server action call | mobile hook TanStack Query)` →
  `@desko/server-actions` (web) oppure `apps/web-shadcn/app/api/presence/*` (mobile)
  → `@desko/services/presence` → `@desko/db`. Il filtro privacy `visibleTo()` vive in
  `@desko/services/presence` e va AND-ato in ogni query che espone presenze altrui.
- **Pattern di test** (per CLAUDE.md): integrazione su PGlite; mock di `@desko/db`
  con `createTestDb()` e di `@desko/auth/server` con stato hoisted — esemplare:
  `packages/queries/src/__tests__/presence-visibility.test.ts`. Mai mockare la chain
  Drizzle.
- **Convenzioni** (per CLAUDE.md): commenti/commit in italiano, conventional commits
  (`feat(scope): …`), branch `feat/…|fix/…|refactor/…` mergiati su main; form web solo
  via `apps/web-shadcn/lib/forms` (`useCreateForm`/`useEditForm`); componenti colocati
  in `_components/`; rotte EN (`/dashboard`, `/calendar`, `/floors`, `/lunch`,
  `/settings`, `/admin/*`); date SOLO via `@desko/domain` (dopo il Plan 002 — se non è
  ancora DONE, scrivi la convenzione attuale e un TODO).
- Esistono `plans/` (questa directory) e `.workflow/PLAN-NEXT.md`: vanno citati come
  "lavoro pianificato".

## Commands you will need

| Purpose      | Command             | Expected on success |
|--------------|---------------------|---------------------|
| Format check | `pnpm format:check` | exit 0 (i .md sono nel glob prettier) |
| Typecheck    | `pnpm type-check`   | exit 0 (sanity: nulla è stato rotto) |

## Scope

**In scope**:
- `README.md` (create, root)
- `CLAUDE.md` (create, root)

**Out of scope**:
- `.workflow/*` (documenti del maintainer), `apps/mobile/CLAUDE.md` (stub esistente),
  qualunque file di codice.

## Git workflow

- Branch: `docs/root-readme-claude-md`
- Commit singolo; stile: `docs: README e CLAUDE.md root`
- Non pushare né aprire PR se non richiesto.

## Steps

### Step 1: README.md

Struttura (target: 80-120 righe, in italiano):

1. Titolo + una frase ("Sai chi sarà in ufficio quando ci sarai tu" — è la tagline in
   `app/layout.tsx`).
2. **Quick start**: prerequisiti (Node 24, pnpm 10), `pnpm install`, setup env (vedi
   fatti sopra), migrazioni+seed, `pnpm --filter @desko/web-shadcn dev` → :3020,
   avvio mobile.
3. **Layout del monorepo**: tabella apps (con lo stato FROZEN di apps/web) + tabella
   packages, un rigo ciascuno.
4. **Comandi**: tabella dei comandi root.
5. **Test**: come girano (`pnpm test:run`, PGlite, zero env) e dove.
6. **Documenti**: link a `.workflow/PRD.md`, `.workflow/PLAN-NEXT.md`, `plans/README.md`.

**Verify**: `pnpm format:check` → exit 0 (se fallisce, formatta SOLO i due file nuovi
con `pnpm prettier --write README.md CLAUDE.md`).

### Step 2: CLAUDE.md

Struttura (target: 60-100 righe — è contesto per agenti, densità > completezza):

1. Una riga su cos'è il prodotto + puntatore al README per il setup.
2. **Comandi di verifica** (la cosa più importante): `pnpm type-check`,
   `pnpm test:run`, cosa NON funziona (build senza env).
3. **Mappa architetturale**: il flusso presence descritto nei fatti sopra, con i path
   esatti; la regola "logica in services, adapter sottili, mai db nelle pagine".
4. **Privacy (US-5/US-6)**: `visibleTo()` da AND-are sempre; k-anonymity in
   hr-analytics; non esporre mai liste utenti negli aggregati HR.
5. **Pattern di test** con il puntatore al file esemplare.
6. **Convenzioni** (lista dei fatti sopra).
7. **Cosa non toccare**: `apps/web` (FROZEN), `stitch_office_presence_tracker/`
   (artefatti di design).

**Verify**: `pnpm format:check` → exit 0; `pnpm type-check` → exit 0.

## Test plan

Non ci sono test automatici per i docs. Gate di qualità: ogni comando citato nei due
file va eseguito davvero una volta (eccetto quelli che richiedono env/device) e deve
comportarsi come descritto.

## Done criteria

- [ ] `README.md` e `CLAUDE.md` esistono alla root e coprono le strutture sopra
- [ ] Ogni comando citato è stato eseguito o marcato esplicitamente "richiede env"
- [ ] Nessun valore di credenziale o URL di database nei file
- [ ] `pnpm format:check` exit 0
- [ ] Riga di stato aggiornata in `plans/README.md`

## STOP conditions

- Un fatto dichiarato in "Current state" risulta falso provandolo (es. il dev server
  non parte su 3020): correggi il documento col fatto reale e segnala la discrepanza
  nel report — non documentare il comportamento atteso ma quello osservato.
- Esiste già un README.md o CLAUDE.md root non vuoto (creato dopo questo piano):
  riconcilia invece di sovrascrivere.

## Maintenance notes

- CLAUDE.md va aggiornato quando: cambia il pattern form, arriva `services/lunch.ts`,
  i piani 002/004/005 cambiano le convenzioni citate.
- Reviewer: controllare che nessun esempio contenga valori di env reali.
