# Plan 004: HR analytics GDPR-strict — k=5, esclusione hidden/banned, breakdown team con suppression

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 622c4d8..HEAD -- packages/queries/src/hr-analytics.ts apps/web-shadcn/app/\(app\)/admin/analytics`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (conflitto di merge con il Plan 002 sullo stesso file: eseguire in sequenza, non in parallelo)
- **Category**: security (privacy/GDPR)
- **Planned at**: commit `622c4d8`, 2026-06-11

## Why this matters

La vista HR `/admin/analytics` (US-6 del PRD) ha tre scostamenti dal PRD con rischio
di re-identificazione: (1) la soglia di k-anonymity nel codice è 3 mentre il PRD
(`.workflow/PRD.md:88`) prescrive <5; (2) il PRD (`PRD.md:89`) dice che gli utenti in
"modalità incognito" (US-5, `presenceVisibility = 'hidden'`) sono esclusi anche dagli
aggregati, ma oggi le loro presenze contano in TUTTE le query e loro stessi contano in
`totalActiveUsers`; (3) manca il breakdown per team con suppression previsto dal piano
del maintainer (`.workflow/PLAN-NEXT.md`, Priorità 3). Questo piano allinea il codice
al PRD ed è esattamente la Priorità 3 di PLAN-NEXT.

## Current state

- `packages/queries/src/hr-analytics.ts` — unico file delle query HR. Punti chiave
  (righe al commit 622c4d8):
  - `:19` — `const MIN_BUCKET_SIZE = 3;`
  - `getHrTodaySummary` (:69-121): `totalActiveUsers` filtra solo
    `eq(userTable.banned, false)`; gli aggregati di `presenceEntries` NON fanno join
    su `user` → contano anche hidden e banned:

    ```ts
    const rows = await db
      .select({ status: presenceEntries.status, floor: presenceEntries.floor,
                count: sql<number>`count(*)::int` })
      .from(presenceEntries)
      .where(eq(presenceEntries.date, date))
      .groupBy(presenceEntries.status, presenceEntries.floor);
    ```

  - `getWeekdayStats` (:127-175): stessa assenza di join/filtro; usa `MIN_BUCKET_SIZE`
    per il flag `suppressed`.
  - `getWeeklyTrend` (:181-210): stessa assenza di join/filtro; NON applica alcuna
    suppression.
  - `getHrAnalyticsSummary` (:215-223): aggrega le tre query per la pagina.
- Consumer: `apps/web-shadcn/app/(app)/admin/analytics/page.tsx:7,21` — chiama solo
  `getHrAnalyticsSummary()`. L'accesso è già gestito dal layout admin (fuori scope).
- Schema utile: `user.presenceVisibility` (valori: `company | team | followers | hidden`),
  `user.banned`, `user.team` (string | null), `presenceEntries.userId/date/status/floor`
  — vedi `packages/db/src/schema.ts`.
- Pattern test: `packages/queries/src/__tests__/presence-visibility.test.ts` (PGlite
  via mock di `@desko/db`, fixture utenti con visibilità diverse). Il vitest root
  raccoglie `packages/**/src/**/__tests__/**/*.test.ts`.
- PRD, vincoli rilevanti (`.workflow/PRD.md:88-90`): soglia <5 con roll-up in "altri
  team"; incognito esclusi dagli aggregati; granularità minima settimanale (vedi
  Maintenance notes — NON in scope qui).

## Commands you will need

| Purpose   | Command                             | Expected on success |
|-----------|-------------------------------------|---------------------|
| Typecheck | `pnpm type-check`                   | exit 0              |
| Tests     | `pnpm test:run -- packages/queries` | tutti verdi         |

## Scope

**In scope**:
- `packages/queries/src/hr-analytics.ts`
- `packages/queries/src/__tests__/hr-analytics.test.ts` (create)
- `apps/web-shadcn/app/(app)/admin/analytics/page.tsx` (solo per renderizzare il
  nuovo breakdown team — sezione aggiuntiva minima, stile delle card esistenti)

**Out of scope**:
- `packages/services/src/presence.ts` e il filtro `visibleTo()` (vista colleghi ≠
  vista HR; non unificarli).
- Il gating di accesso a `/admin/*`.
- Rimuovere la vista "oggi" (vedi Maintenance notes).

## Git workflow

- Branch: `fix/hr-analytics-gdpr-strict`
- Commit per step; stile: `fix(queries): hr-analytics k=5 + esclusione hidden/banned`
- Non pushare né aprire PR se non richiesto.

## Steps

### Step 1: Soglia e filtro base

In `hr-analytics.ts`:

1. `MIN_BUCKET_SIZE` da `3` a `5`, con commento:
   `// k-anonymity: PRD US-6 prescrive <5 (validare con DPO prima di modificare).`
2. Definisci una condizione riusabile per "utente conteggiabile negli aggregati HR":

   ```ts
   const hrCountableUser = and(
     eq(userTable.banned, false),
     sql`${userTable.presenceVisibility} <> 'hidden'`,
   );
   ```

3. `getHrTodaySummary`: applica `hrCountableUser` al conteggio `totalActiveUsers` e
   aggiungi `innerJoin(userTable, eq(presenceEntries.userId, userTable.id))` +
   `hrCountableUser` nel where della query sugli status.
4. `getWeekdayStats` e `getWeeklyTrend`: stesso innerJoin + filtro.

**Verify**: `pnpm type-check` → exit 0.

### Step 2: Breakdown per team con suppression (PLAN-NEXT P3.3)

Aggiungi in `hr-analytics.ts`:

```ts
export type TeamStat = { team: string; activeUsers: number; inOfficeAvg: number; inOfficePct: number };
export async function getTeamStats(): Promise<TeamStat[]>
```

Semantica: ultimi 28 giorni, soli feriali (riusa il pattern EXTRACT(DOW) di
`getWeekdayStats`), join `presenceEntries` × `user` con `hrCountableUser`, group by
`user.team` (i `team IS NULL` confluiscono in `'Altri team'`). I team con **meno di
`MIN_BUCKET_SIZE` utenti attivi conteggiabili** vengono accorpati in un'unica riga
`'Altri team'` (somma utenti e presenze) — è il roll-up del PRD:88, non un semplice
azzeramento. Ordina per `inOfficeAvg` desc. Integra il risultato in
`getHrAnalyticsSummary` (quarto campo `teams`, query in `Promise.all` con le altre).

In `app/(app)/admin/analytics/page.tsx` aggiungi una card "Per team" che renderizza
`summary.teams` (tabella semplice: team / attivi / media in office / %), copiando lo
stile delle card già presenti nella pagina.

**Verify**: `pnpm type-check` → exit 0.

### Step 3: Test

Crea `packages/queries/src/__tests__/hr-analytics.test.ts` sul pattern di
`presence-visibility.test.ts` (mock `@desko/db` → PGlite; queste query non usano
l'auth quindi il mock auth non serve, ma se l'import chain lo richiede copia anche
quello). Fixture: ~8 utenti — 6 visibili su 2 team (5 'Engineering', 1 'Design'),
1 hidden, 1 banned — con presenze in_office su date note (usa date fisse passate,
es. tutta la settimana `2026-06-01`..`2026-06-05`, e per il test "today" inserisci
presenze su `todayIso()` calcolata come fa il modulo).

Casi minimi:
1. `getHrTodaySummary`: l'utente hidden e il banned NON contano né in
   `totalActiveUsers` né in `inOfficeTotal` (assert sui numeri esatti della fixture).
2. `getWeekdayStats`: media che scenderebbe sotto 5 → `suppressed: true` e valori a 0;
   sopra soglia → valori reali.
3. `getTeamStats`: 'Engineering' (5 attivi) compare; 'Design' (1 attivo, < 5) è
   accorpato in 'Altri team'; hidden/banned non contano in nessun team.
4. `getWeeklyTrend`: le presenze dell'utente hidden non compaiono nei totali.

**Verify**: `pnpm test:run -- packages/queries` → tutti verdi.

## Test plan

Vedi Step 3 (≈8 test). Pattern: `presence-visibility.test.ts`.
Verifica: `pnpm test:run` → exit 0.

## Done criteria

- [ ] `pnpm type-check` exit 0
- [ ] `pnpm test:run` exit 0, incluso il nuovo `hr-analytics.test.ts`
- [ ] `grep -n "MIN_BUCKET_SIZE = " packages/queries/src/hr-analytics.ts` → `= 5`
- [ ] Tutte e 4 le query HR fanno join su `user` con filtro hidden+banned (lettura diff)
- [ ] `/admin/analytics` renderizza la card "Per team" (smoke: `pnpm --filter @desko/web-shadcn dev`)
- [ ] Riga di stato aggiornata in `plans/README.md`

## STOP conditions

- Gli estratti non corrispondono (in particolare se il Plan 002 ha già toccato
  `hr-analytics.ts`: in quel caso usa `todayIso`/`addDaysIso` di `@desko/domain`
  invece degli helper locali, e prosegui).
- Lo schema non ha `user.presenceVisibility` o `user.team` come descritto.
- Il rendering della card team richiede di ristrutturare la pagina analytics oltre
  l'aggiunta di una sezione.

## Maintenance notes

- **Decisione aperta per il maintainer (non risolta da questo piano)**: il PRD:90
  prescrive granularità minima settimanale ("no realtime"), ma `getHrTodaySummary`
  espone lo snapshot di oggi. Va validato con il DPO se la vista "oggi" può restare
  (è aggregata e ora sopra-soglia) o va rimossa. Stessa cosa per il valore k=5.
- Se si aggiungono nuove query HR, devono riusare `hrCountableUser` e la suppression —
  reviewer: respingere query HR senza join su `user`.
- Il Plan 002 tocca gli helper data di questo file: eseguire 002 e 004 in sequenza.
