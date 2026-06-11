# Plan 002: Centralizzare le date in un modulo timezone-aware Europe/Rome in @desko/domain

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 622c4d8..HEAD -- packages/domain packages/services/src/presence.ts packages/queries/src/lunch.ts packages/queries/src/hr-analytics.ts apps/web-shadcn/app apps/mobile`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-tests-presence-services-api.md
- **Category**: bug
- **Planned at**: commit `622c4d8`, 2026-06-11

## Why this matters

Desko è un'app di presenza **per giorno** per un ufficio di Milano, ma il confine del
giorno è calcolato ovunque nella timezone del processo. In produzione (server UTC,
es. Vercel) per un utente di Milano tra mezzanotte e le 2:00 "oggi" è ancora **ieri**:
presenze dichiarate sul giorno sbagliato, dashboard che mostra il giorno sbagliato,
flag `isLastMinute` che scatta alle 10:00 invece che alle 8:00 ora italiana. La stessa
funzione `Date → 'YYYY-MM-DD'` è inoltre re-implementata in 7+ punti tra packages, web
e mobile. Questo piano introduce un modulo data canonico in `@desko/domain` con
semantica esplicita Europe/Rome e migra tutti i call site.

## Current state

- `packages/domain/src/index.ts` — package puro (zero dipendenze runtime), già
  importato sia dal web sia dal mobile. Unico file: `index.ts` (tipi `Floor`,
  `PresenceStatus`, `ActionResult`, `FLOOR_META`).
- Implementazioni duplicate del formato `YYYY-MM-DD`, tutte basate sui **campi locali**
  del processo:
  - `packages/services/src/presence.ts:103` — `export const todayIso` +
    `isLastMinute` (:130-133):

    ```ts
    function isLastMinute(targetDate: string): boolean {
      const today = new Date();
      return targetDate === todayIso() && today.getHours() >= LAST_MINUTE_HOUR;
    }
    ```

  - `packages/queries/src/lunch.ts:87` — `todayIso` locale al modulo.
  - `packages/queries/src/hr-analytics.ts:55-64` — `todayISO` + `daysAgoISO(n)`.
  - `apps/web-shadcn/app/(app)/calendar/page.tsx:85` — `isoDate(d)` (server component).
  - `apps/web-shadcn/app/(app)/calendar/_components/my-presence-item.tsx:37` —
    `isoToday()` (client component).
  - `apps/web-shadcn/app/(app)/lunch/page.tsx:15-20` — `isoToday()` / `isoTomorrow()`.
  - `apps/web-shadcn/app/(app)/lunch/_components/create-proposal-button.tsx:59` —
    `toIsoDate(d)` su data scelta dall'utente (client).
  - `apps/mobile/lib/api.ts:57` — `todayIso()` (commento: "stessa convenzione del backend").
  - `apps/mobile/app/(app)/(tabs)/_components/month-grid.tsx:19` — `toIso(d)`.
- Distinzione concettuale importante (guida le sostituzioni):
  1. **"Oggi/adesso" di dominio** (quale giorno è, che ora è): DEVE essere Europe/Rome
     ovunque (server UTC, client, mobile).
  2. **Estrazione campi da una Date costruita per aritmetica di calendario**
     (es. `new Date(year, month, 1)` per costruire la griglia mese, o una data scelta
     dall'utente in un picker): è matematica locale coerente, NON va convertita di
     timezone — va solo deduplicata.

## Commands you will need

| Purpose   | Command           | Expected on success |
|-----------|-------------------|---------------------|
| Typecheck | `pnpm type-check` | exit 0              |
| Tests     | `pnpm test:run`   | tutti verdi (≥45 dopo il Plan 001) |

## Scope

**In scope**:
- `packages/domain/src/date.ts` (create), `packages/domain/src/index.ts` (re-export),
  `packages/domain/src/__tests__/date.test.ts` (create)
- I 9 call site elencati sopra (services, queries/lunch, queries/hr-analytics,
  calendar page, my-presence-item, lunch page, create-proposal-button, mobile api.ts,
  mobile month-grid)
- `packages/domain/package.json` SOLO se serve aggiungere un export path

**Out of scope**:
- `apps/web` (congelata) — contiene helper simili: NON toccarla.
- Lo schema DB e il tipo della colonna `presence_entries.date`.
- Qualsiasi cambio di UX o di semantica del cutoff last-minute (resta le 08:00).
- `packages/queries/src/hr-analytics.ts` oltre alla pura sostituzione di
  `todayISO`/`daysAgoISO` (le modifiche GDPR sono il Plan 004 — se è già stato
  eseguito, fai solo la sostituzione meccanica degli helper).

## Git workflow

- Branch: `fix/timezone-europe-rome`
- Commit per step; stile: `fix(domain): date canoniche Europe/Rome in @desko/domain`
- Non pushare né aprire PR se non richiesto.

## Steps

### Step 1: Creare il modulo `packages/domain/src/date.ts`

```ts
/**
 * Date di dominio Desko — il "giorno" dell'app è il giorno civile di Milano.
 * Tutte le stringhe data sono 'YYYY-MM-DD'.
 */
export const APP_TIME_ZONE = 'Europe/Rome';

// en-CA produce direttamente YYYY-MM-DD.
const isoFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});
const hourFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE, hour: '2-digit', hour12: false,
});

/** Giorno civile a Milano dell'istante dato (default: adesso). */
export function isoDateInAppTz(instant: Date = new Date()): string {
  return isoFmt.format(instant);
}

/** 'YYYY-MM-DD' di oggi a Milano. */
export const todayIso = (): string => isoDateInAppTz();

/** Ora 0-23 a Milano dell'istante dato (default: adesso). */
export function hourInAppTz(instant: Date = new Date()): number {
  return Number(hourFmt.format(instant));
}

/** Aritmetica pura su stringhe ISO: addDaysIso('2026-06-11', -28) → '2026-05-14'. */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y!, m! - 1, d! + days));
  return t.toISOString().slice(0, 10);
}

/** Estrae 'YYYY-MM-DD' dai campi LOCALI di una Date (aritmetica di calendario/picker UI). */
export function isoDateLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
```

Re-esporta tutto da `packages/domain/src/index.ts` (`export * from './date';`).
Nota: `hourFmt` con `en-GB` può produrre "24" per la mezzanotte su alcune versioni ICU —
normalizza con `% 24` se il test di Step 2 lo evidenzia.

**Verify**: `pnpm type-check` → exit 0.

### Step 2: Test unitari del modulo

Crea `packages/domain/src/__tests__/date.test.ts` (vitest root lo raccoglie già).
Casi, con istanti UTC espliciti (Roma = UTC+2 in giugno, UTC+1 in gennaio):

- `isoDateInAppTz(new Date('2026-06-10T22:30:00Z'))` → `'2026-06-11'` (scavalca mezzanotte).
- `isoDateInAppTz(new Date('2026-01-15T23:30:00Z'))` → `'2026-01-16'` (ora solare).
- `isoDateInAppTz(new Date('2026-06-10T12:00:00Z'))` → `'2026-06-10'`.
- `hourInAppTz(new Date('2026-06-10T06:30:00Z'))` → `8` (il cutoff last-minute).
- `hourInAppTz(new Date('2026-06-10T05:59:00Z'))` → `7`.
- `addDaysIso('2026-03-01', -1)` → `'2026-02-28'`; `addDaysIso('2026-06-11', -28)` → `'2026-05-14'`.
- `isoDateLocal(new Date(2026, 5, 1))` → `'2026-06-01'`.

**Verify**: `pnpm test:run -- packages/domain` → tutti verdi.

### Step 3: Migrare i packages server-side

1. `packages/services/src/presence.ts`: elimina la definizione locale di `todayIso`
   (:103-106) e importa `todayIso, hourInAppTz` da `@desko/domain`. Per compatibilità
   con i consumer esistenti mantieni il re-export: `export { todayIso } from '@desko/domain';`.
   Riscrivi `isLastMinute`:

   ```ts
   function isLastMinute(targetDate: string): boolean {
     return targetDate === todayIso() && hourInAppTz() >= LAST_MINUTE_HOUR;
   }
   ```

2. `packages/queries/src/lunch.ts`: sostituisci la `todayIso` locale (:87) con l'import
   da `@desko/domain`.
3. `packages/queries/src/hr-analytics.ts`: sostituisci `todayISO()` → `todayIso()` e
   `daysAgoISO(n)` → `addDaysIso(todayIso(), -n)`, import da `@desko/domain`; elimina
   le definizioni locali (:55-64). Verifica che `@desko/domain` sia già tra le
   dependencies di `packages/queries/package.json` (lo è) e di
   `packages/services/package.json` (lo è).

**Verify**: `pnpm type-check && pnpm test:run` → exit 0, tutti verdi.

### Step 4: Migrare apps/web-shadcn

1. `app/(app)/calendar/page.tsx`: sostituisci `const todayIsoStr = isoDate(today)`
   (riga ~666) con `todayIso()` da `@desko/domain`, e fai derivare anno/mese di default
   dalla stringa `todayIsoStr` (split su `-`), NON da `new Date()` locale. Le chiamate
   `isoDate(start)`/`isoDate(end)` sulla griglia (righe ~691, 736-738) sono aritmetica
   di calendario: sostituiscile con `isoDateLocal` importata da `@desko/domain` ed
   elimina la `isoDate` locale (:85).
2. `app/(app)/calendar/_components/my-presence-item.tsx`: sostituisci `isoToday()`
   (:37) con `todayIso()` da `@desko/domain`.
3. `app/(app)/lunch/page.tsx`: `isoToday()` → `todayIso()`,
   `isoTomorrow()` → `addDaysIso(todayIso(), 1)`; elimina le funzioni locali (:15-20).
4. `app/(app)/lunch/_components/create-proposal-button.tsx`: `toIsoDate(d)` →
   `isoDateLocal(d)` (data scelta nel picker: semantica locale corretta).

**Verify**: `pnpm type-check && pnpm test:run` → verdi. Smoke manuale facoltativo:
`pnpm --filter @desko/web-shadcn dev` e apri `/calendar`.

### Step 5: Migrare apps/mobile

1. `apps/mobile/lib/api.ts`: sostituisci il corpo di `todayIso()` (:57-60) con un
   re-export/delega a `todayIso` di `@desko/domain` (`@desko/domain` è già dependency
   di `@desko/mobile`).
2. `apps/mobile/app/(app)/(tabs)/_components/month-grid.tsx`: `toIso` (:19) è usata
   sia per la griglia (aritmetica locale → `isoDateLocal`) sia per `todayStr` (:30,
   confine "oggi" → `todayIso()`). Importa entrambe da `@desko/domain`, mantieni
   l'export `toIso = isoDateLocal` per non rompere `calendar.tsx`, e usa `todayIso()`
   per `todayStr`. In `calendar.tsx` sostituisci i due `toIso(new Date())`
   (:124, :155) con `todayIso()`.
   ATTENZIONE: questi due file mobile erano **modificati/untracked** al momento della
   stesura — rileggi lo stato reale prima di toccarli.

**Verify**: `pnpm type-check` → exit 0 (il type-check di `@desko/mobile` gira nel task
turbo). `grep -rn "getFullYear()}-" packages apps/web-shadcn apps/mobile --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v domain/src/date.ts` → nessun match.

## Test plan

- Nuovi: `packages/domain/src/__tests__/date.test.ts` (Step 2, 7 casi).
- Regressione: la suite del Plan 001 (`packages/services/__tests__/presence.test.ts`)
  deve restare verde — in particolare i test su `declarePresence`/`declareWeek` che
  toccano `isLastMinute`.
- Verifica: `pnpm test:run` → exit 0.

## Done criteria

- [ ] `pnpm type-check` exit 0
- [ ] `pnpm test:run` exit 0, inclusi i 7 test nuovi di `date.test.ts`
- [ ] Il grep dello Step 5 non trova più pattern `getFullYear()}-` fuori da `domain/src/date.ts`
- [ ] `isLastMinute` non usa più `new Date().getHours()` (grep `getHours` in `packages/services` → 0 match)
- [ ] Nessun file fuori scope modificato (`git status`)
- [ ] Riga di stato aggiornata in `plans/README.md`

## STOP conditions

- Il Plan 001 non risulta DONE in `plans/README.md` (serve la rete di sicurezza).
- Gli estratti non corrispondono al codice reale (drift) — in particolare i file
  mobile WIP.
- `Intl.DateTimeFormat` con `timeZone: 'Europe/Rome'` non è disponibile nel runtime
  mobile (Hermes): se il type-check o un test mobile fallisce per questo, fermati e
  riporta — NON introdurre una libreria di date senza decisione dell'operatore.
- Un test della suite 001 cambia esito e non è spiegabile con la correzione del
  confine di giorno.

## Maintenance notes

- D'ora in poi ogni nuovo "oggi"/"che ora è" passa da `@desko/domain` — un reviewer
  deve respingere nuovi `new Date().getHours()` o template `${d.getFullYear()}-…`.
- Il Plan 004 (HR analytics) tocca anche `hr-analytics.ts`: se eseguiti in parallelo
  ci sarà conflitto su quel file — eseguili in sequenza.
- Deliberatamente NON gestito: utenti fuori timezone Italia vedono il giorno di Milano
  (corretto per il dominio: l'ufficio è a Milano). Documentato nel modulo.
