# Plan 001: Coprire con test di integrazione il servizio presence e le route REST mobile

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 622c4d8..HEAD -- packages/services packages/db/src/testing.ts apps/web-shadcn/app/api vitest.config.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `622c4d8`, 2026-06-11

## Why this matters

`packages/services/src/presence.ts` (1040 righe, ~15 funzioni esportate) è il cuore
dell'app — dichiarazione presenze, cambio piano, pattern settimanali, privacy GDPR,
follow — ed è stato estratto in un package puro 2 giorni fa **senza alcun test
diretto**. Le 5 route REST consumate dall'app mobile (`apps/web-shadcn/app/api/presence/*`)
sono anch'esse non testate, e il pattern `include` di vitest esclude `apps/**`, quindi
oggi un test su quelle route non girerebbe nemmeno. Questo piano stabilisce la baseline
di verifica che i piani 002, 003 e 005 useranno come rete di sicurezza: **va eseguito
per primo**.

## Current state

- `vitest.config.ts` (root) — config unica; PGlite con timeout 20s. La riga chiave:

  ```ts
  // vitest.config.ts:16
  include: ['packages/**/src/**/__tests__/**/*.test.ts'],
  ```

- `packages/services/src/presence.ts` — servizio puro. Le funzioni di **lettura**
  prendono un `Viewer | null` o uno `userId`; le **mutation** prendono `(userId, input)`
  e ritornano `ActionResult<T>` (`{ ok: true, data } | { ok: false, message, fieldErrors? }`).
  NON chiama mai l'auth: l'identità arriva come parametro. Importa `db` da `@desko/db`.
  Export principali da coprire (con riga al commit 622c4d8):
  - letture: `getPresencesForDate` (:180), `getTodayCounts` (:234), `getFloorOccupancy` (:277),
    `getPresenceToday` (:317), `getWeeklyPattern` (:343), `getProfile` (:373),
    `getPresencesForRange` (:549), `getMonthCounts` (:599), `searchUsers` (:508)
  - mutation: `declarePresence` (:701), `updateFloor` (:753), `leaveOffice` (:801),
    `declareWeek` (:836), `updateWeeklyPattern` (:884), `updateVisibility` (:925),
    `archivePastPresences` (:953), `followUser` (:978), `unfollowUser` (:1014)
- `packages/db/src/testing.ts` — `createTestDb()`: PGlite in-process con le migrazioni
  SQL reali applicate. Ogni chiamata = DB nuovo e isolato.
- Test esistenti (gli **unici due** del repo, da usare come pattern):
  - `packages/queries/src/__tests__/presence-visibility.test.ts` — mocka `@desko/db`
    con PGlite e `@desko/auth/server` con uno stato hoisted mutabile:

    ```ts
    const authState = vi.hoisted(() => ({ userId: null as string | null }));
    vi.mock('@desko/auth/server', () => ({
      getCurrentUserId: async () => {
        if (!authState.userId) throw new Error('UNAUTHORIZED');
        return authState.userId;
      },
    }));
    vi.mock('@desko/db', async () => {
      const { createTestDb } = await import('@desko/db/testing');
      return { db: await createTestDb() };
    });
    // Import DOPO i mock.
    ```

  - `packages/server-actions/src/__tests__/lunch.test.ts` — stesso pattern, in più
    mocka `next/cache` (le server actions chiamano `revalidatePath`).
- Route REST (adapter sottili). Esempio `apps/web-shadcn/app/api/presence/today/route.ts`:

  ```ts
  export async function GET() {
    try {
      const [me, counts, entries] = await Promise.all([
        getMyPresenceToday(), getTodayCounts(), getPresencesForDate(),
      ]);
      return NextResponse.json({ me, counts, entries });
    } catch (e) {
      return errorResponse(e);
    }
  }
  ```

  Le route importano da `@desko/queries/presence` / `@desko/server-actions/presence`,
  che a loro volta risolvono l'utente via `getCurrentUserId()` di `@desko/auth/server`.
  `app/api/presence/range/route.ts` valida `from`/`to` inline (regex + span ≤ 62 giorni).
  ATTENZIONE: al momento della stesura `range/route.ts` era **untracked** (WIP non
  committato) — se non esiste, salta i suoi test e segnalalo nel report finale.

Convenzioni repo: commenti e messaggi in italiano; commit conventional
(`feat(scope): …`, `test(scope): …`); i test usano `describe/it` con nomi in italiano.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Install   | `pnpm install` (root)            | exit 0              |
| Typecheck | `pnpm type-check`                | exit 0              |
| Tests     | `pnpm test:run`                  | tutti verdi (oggi: 15) |
| Un file   | `pnpm test:run -- <path>`        | file verde          |

## Scope

**In scope** (the only files you should modify/create):
- `vitest.config.ts` (estendere `include`)
- `packages/services/src/__tests__/presence.test.ts` (create)
- `apps/web-shadcn/app/api/__tests__/presence-routes.test.ts` (create)

**Out of scope** (do NOT touch):
- `packages/services/src/presence.ts` e qualunque codice di produzione — questo piano
  è SOLO caratterizzazione. Se un test rivela un bug, scrivi il test che documenta il
  comportamento atteso, marcalo `it.fails(...)` con un commento, e segnalalo nel report.
- `apps/web` (app MUI congelata), `apps/mobile`.

## Git workflow

- Branch: `test/presence-services-api`
- Commit per step; stile: `test(services): integrazione presence via PGlite`
- Non pushare né aprire PR se non richiesto dall'operatore.

## Steps

### Step 1: Estendere l'include di vitest alle route di web-shadcn

In `vitest.config.ts` sostituisci la riga `include` con:

```ts
include: [
  'packages/**/src/**/__tests__/**/*.test.ts',
  'apps/web-shadcn/**/__tests__/**/*.test.ts',
],
```

**Verify**: `pnpm test:run` → i 15 test esistenti restano verdi.

### Step 2: Test di integrazione del servizio presence

Crea `packages/services/src/__tests__/presence.test.ts` modellato su
`presence-visibility.test.ts` (mock di `@desko/db` con PGlite; qui NON serve il mock
auth: le funzioni del servizio prendono `userId`/`Viewer` come parametro). Fixture in
`beforeAll`: 4-5 utenti con team e `presenceVisibility` diversi (vedi la fixture
`USERS` del file esemplare), una relazione `follows`, qualche `presenceEntries`.

Casi minimi da coprire (≈25 test):

- `declarePresence`: happy path in_office con floor; status remote senza floor;
  upsert sullo stesso giorno (seconda chiamata aggiorna, non duplica); input invalido
  (status fuori enum) → `ok: false` con `fieldErrors`.
- `updateFloor`: cambia piano di una presenza esistente; su giorno senza presenza →
  comportamento attuale (caratterizzalo, qualunque sia).
- `leaveOffice`: imposta lo stato per oggi; caratterizza il caso "nessuna presenza oggi".
- `declareWeek`: 5 giorni scritti in una chiamata (`data.count === 5`); ripetuta con
  status diversi → upsert. (La non-atomicità in caso di errore a metà è oggetto del
  Plan 003 — non testarla qui.)
- `updateWeeklyPattern` + `getWeeklyPattern`: round-trip.
- `updateVisibility` + `getPresencesForDate`: dopo il passaggio a 'hidden' le presenze
  spariscono per un viewer terzo ma restano visibili a se stessi.
- `archivePastPresences`: **regressione del bug bcac8f9** — inserisci presenze passate
  e future per due utenti; verifica che cancelli SOLO le passate e SOLO quelle
  dell'utente chiamante.
- `followUser`/`unfollowUser`: round-trip + effetto sulla visibilità 'followers'.
- `getTodayCounts`, `getFloorOccupancy`, `getMonthCounts`, `getPresencesForRange`:
  un assert ciascuno sui conteggi attesi della fixture.

**Verify**: `pnpm test:run -- packages/services` → tutti verdi.

### Step 3: Test delle route REST

Crea `apps/web-shadcn/app/api/__tests__/presence-routes.test.ts`. Mock identici al
file esemplare (`@desko/db` → PGlite, `@desko/auth/server` → `authState` hoisted) più
`vi.mock('next/cache', () => ({ revalidatePath: () => {} }))` (le route di mutation
passano dalle server actions che lo chiamano). Importa gli handler direttamente:

```ts
import { GET as getToday } from '../presence/today/route';
import { POST as postDeclare } from '../presence/declare/route';
```

Casi (≈10 test):
- `GET today` con sessione → 200, body con chiavi `me`, `counts`, `entries`.
- `GET today` senza sessione (`authState.userId = null`) → 401, `{ error: 'UNAUTHORIZED' }`.
- `POST declare` valido → 200 `{ data: { date, status, floor } }`; invalido → 400 con
  `fieldErrors`; senza sessione → 401. Costruisci la request con
  `new NextRequest('http://test.local/api/presence/declare', { method: 'POST', body: JSON.stringify(...) })`
  (oppure un oggetto `{ json: async () => body }` castato, se NextRequest dà problemi
  in ambiente node — scegli quello che compila e documentalo nel test).
- `POST leave`, `POST floor`: un happy path ciascuno.
- `GET range` (SOLO se il file esiste): `from`/`to` validi → 200; formato errato → 400;
  span > 62 giorni → 400.

**Verify**: `pnpm test:run -- apps/web-shadcn` → tutti verdi.

### Step 4: Verifica finale completa

**Verify**: `pnpm test:run` → ~50 test verdi totali; `pnpm type-check` → exit 0.

## Test plan

Questo piano È il test plan. Pattern strutturale: `presence-visibility.test.ts`.
Verifica: `pnpm test:run` → exit 0 con ≥45 test.

## Done criteria

- [ ] `pnpm type-check` exit 0
- [ ] `pnpm test:run` exit 0; esistono `packages/services/src/__tests__/presence.test.ts`
      e `apps/web-shadcn/app/api/__tests__/presence-routes.test.ts`
- [ ] `archivePastPresences` ha un test di regressione che fallirebbe con un WHERE sempre-vero
- [ ] Nessun file di produzione modificato a parte `vitest.config.ts` (`git status`)
- [ ] Riga di stato aggiornata in `plans/README.md`

## STOP conditions

- Gli estratti in "Current state" non corrispondono al codice (drift).
- Il mock `vi.mock('@desko/db', ...)` non viene raccolto dalle route (gli handler
  vedono il db reale): fermati e riporta — non aggiungere `DATABASE_URL` reali.
- Un test rivela un bug di produzione che non riesci a caratterizzare con `it.fails`.
- Una verifica fallisce due volte dopo un tentativo ragionevole di fix.

## Maintenance notes

- I piani 002 (date), 003 (declareWeek) e 005 (errori API) estendono questa suite:
  chi li esegue deve trovarla verde prima di iniziare.
- Reviewer: controllare che i test assertino su righe DB reali (PGlite), non su mock
  della chain Drizzle.
- Component test (jsdom/RTL) e Playwright e2e restano fuori scope (PLAN-NEXT P6).
