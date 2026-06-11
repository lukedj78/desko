# Plan 003: Rendere atomica la dichiarazione settimanale (declareWeek)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 622c4d8..HEAD -- packages/services/src/presence.ts packages/services/src/__tests__`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-tests-presence-services-api.md
- **Category**: bug
- **Planned at**: commit `622c4d8`, 2026-06-11

## Why this matters

`declareWeek` scrive 5-7 giorni di presenza con un `await` in loop, una INSERT per
giorno, senza transazione: se la terza fallisce, i primi due giorni restano scritti e
gli altri no. Web e mobile mostrano una settimana dichiarata a metà senza che l'utente
lo sappia. In più, su Neon serverless ogni statement è un round-trip: 7 round-trip per
una sola azione utente. Un singolo upsert multi-riga risolve entrambe le cose: è
atomico per definizione (uno statement) e costa un round-trip.

## Current state

- `packages/services/src/presence.ts:836-880` — `declareWeek(userId, input)`. Il corpo
  attuale (al commit 622c4d8):

  ```ts
  const rows = parsed.data.days.map((d) => ({
    id: randomUUID(),
    userId,
    date: d.date,
    status: d.status,
    floor: d.floor ?? null,
    isLastMinute: d.status === 'in_office' && isLastMinute(d.date),
    fromPattern: false,
    lastFloorUpdateAt: d.floor ? new Date() : null,
  }));

  for (const row of rows) {
    await db
      .insert(presenceEntries)
      .values(row)
      .onConflictDoUpdate({
        target: [presenceEntries.userId, presenceEntries.date],
        set: {
          status: row.status,
          floor: row.floor,
          isLastMinute: row.isLastMinute,
          fromPattern: false,
          lastFloorUpdateAt: row.lastFloorUpdateAt,
          updatedAt: new Date(),
        },
      });
  }

  return { ok: true, data: { count: rows.length } };
  ```

- Il client db è Drizzle (`drizzle-orm/neon-serverless` in produzione,
  `drizzle-orm/pglite` nei test via `@desko/db/testing`). Entrambi supportano
  `.values(rows)` multi-riga e `onConflictDoUpdate` con riferimenti `excluded.*`.
- Dopo il Plan 001 esiste `packages/services/src/__tests__/presence.test.ts` con i
  test di `declareWeek` (happy path 5 giorni + upsert) da mantenere verdi.

## Commands you will need

| Purpose   | Command                            | Expected on success |
|-----------|------------------------------------|---------------------|
| Typecheck | `pnpm type-check`                  | exit 0              |
| Tests     | `pnpm test:run -- packages/services` | tutti verdi       |

## Scope

**In scope**:
- `packages/services/src/presence.ts` (solo la funzione `declareWeek`)
- `packages/services/src/__tests__/presence.test.ts` (estendere)

**Out of scope**:
- Le altre funzioni di `presence.ts` (in particolare `declarePresence`, che fa un
  singolo upsert ed è già atomica).
- `packages/server-actions`, le route API, lo schema DB.

## Git workflow

- Branch: `fix/declare-week-atomic`
- Commit singolo; stile: `fix(services): declareWeek upsert multi-riga atomico`
- Non pushare né aprire PR se non richiesto.

## Steps

### Step 1: Sostituire il loop con un upsert multi-riga

Approccio primario — un solo statement con `excluded.*` (import `sql` da
`drizzle-orm`, già importato nel file):

```ts
await db
  .insert(presenceEntries)
  .values(rows)
  .onConflictDoUpdate({
    target: [presenceEntries.userId, presenceEntries.date],
    set: {
      status: sql`excluded.status`,
      floor: sql`excluded.floor`,
      isLastMinute: sql`excluded.is_last_minute`,
      fromPattern: false,
      lastFloorUpdateAt: sql`excluded.last_floor_update_at`,
      updatedAt: new Date(),
    },
  });
```

Nota: i nomi in `excluded.*` sono le **colonne SQL** (snake_case — il client è
configurato con `casing: 'snake_case'`). Verifica i nomi reali in
`packages/db/src/schema.ts` prima di scrivere.

**Fallback** (solo se l'approccio primario fallisce nei test per sintassi non
supportata): mantieni il loop ma avvolgilo in `await db.transaction(async (tx) => { ... })`
sostituendo `db` con `tx` all'interno. Documenta nel report quale approccio hai usato.

**Verify**: `pnpm type-check` → exit 0.

### Step 2: Estendere i test

In `packages/services/src/__tests__/presence.test.ts` aggiungi/aggiorna:

1. Happy path (già esistente dal Plan 001): 5 giorni → `ok: true`, `count: 5`,
   5 righe in `presenceEntries` per quello user.
2. Upsert: seconda `declareWeek` sugli stessi giorni con status diversi → ancora 5
   righe (nessun duplicato), status aggiornati, `fromPattern` false.
3. Atomicità: chiama `declareWeek` per un `userId` inesistente (violazione FK su
   `user_id`) con 5 giorni → `ok: false` e **zero** righe scritte per quello userId.
   (Con il multi-riga la FK fallisce l'intero statement; questo test fissa il
   comportamento "tutto o niente".)

**Verify**: `pnpm test:run -- packages/services` → tutti verdi, inclusi i 3 sopra.

## Test plan

Vedi Step 2. Pattern strutturale: i test `declareWeek` già presenti nel file.
Verifica: `pnpm test:run` → exit 0.

## Done criteria

- [ ] `pnpm type-check` exit 0
- [ ] `pnpm test:run` exit 0, incluso il test di atomicità (zero righe su errore)
- [ ] In `declareWeek` non c'è più un `await` dentro un `for` (lettura del diff)
- [ ] Nessun file fuori scope modificato (`git status`)
- [ ] Riga di stato aggiornata in `plans/README.md`

## STOP conditions

- Il Plan 001 non risulta DONE (i test di caratterizzazione devono esistere).
- Lo schema in `packages/db/src/schema.ts` non ha la unique su `(user_id, date)` che
  il codice attuale presuppone.
- Sia l'approccio primario sia il fallback transazione falliscono i test.

## Maintenance notes

- Se in futuro `declareWeek` dovrà fare logiche per-giorno (es. cap di piano per
  data), il singolo statement andrà ripensato — a quel punto la forma giusta è la
  transazione del fallback.
- Reviewer: controllare i nomi snake_case in `excluded.*` contro lo schema.
