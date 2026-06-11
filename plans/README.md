# Implementation Plans

Generati dalla skill `improve` il 2026-06-11, al commit `622c4d8` (audit livello
`standard`: 4 agenti paralleli su correttezza/sicurezza, performance/debito,
test/DX/docs, dipendenze/direzione; finding verificati a mano sul codice).
Esegui nell'ordine sotto salvo diversa indicazione delle dipendenze. Ogni executor:
leggi il piano per intero prima di iniziare, rispetta le sue STOP conditions e
aggiorna la tua riga a fine lavoro.

> Nota di contesto: al momento della pianificazione il working tree aveva lavoro NON
> committato (tab calendar mobile + `apps/web-shadcn/app/api/presence/range/`). I
> drift check dei piani usano `622c4d8`; per i file WIP fidati dello stato reale.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| 001  | Test di integrazione servizio presence + route REST | P1 | M | — | TODO |
| 002  | Date timezone-aware Europe/Rome in @desko/domain | P1 | M | 001 | TODO |
| 003  | declareWeek atomico (upsert multi-riga) | P2 | S | 001 | TODO |
| 004  | HR analytics GDPR-strict (k=5, hidden, team) | P1 | S | — (sequenza con 002) | TODO |
| 005  | Sanitizzare errori API + error boundary | P2 | S | 001 | TODO |
| 006  | CI GitHub Actions (type-check + test + format) | P2 | S | — | TODO |
| 007  | README.md + CLAUDE.md root | P2 | M | — | TODO |
| 008  | Lunch su mobile (REST /api/lunch/* + tab Pranzo) | P3 | M | 005 | TODO |

Status values: TODO | IN PROGRESS | DONE | BLOCKED (with one-line reason) | REJECTED (with one-line rationale)

## Dependency notes

- **001 prima di 002, 003, 005**: 001 è la baseline di caratterizzazione (suite
  PGlite su `services/presence.ts` + fix dell'`include` vitest che oggi esclude
  `apps/**`). 002 cambia la semantica del confine di giorno, 003 riscrive
  `declareWeek`, 005 testa il contratto errori delle route: tutti e tre hanno
  bisogno di quella rete e di quell'infra.
- **002 e 004 in sequenza, non in parallelo**: toccano entrambi
  `packages/queries/src/hr-analytics.ts` (002 gli helper data, 004 le query).
  L'ordine tra loro è indifferente; entrambi hanno istruzioni per il caso in cui
  l'altro sia già passato.
- **005 prima di 008**: le nuove route lunch devono nascere sul contratto errori già
  sanitizzato.
- 006 e 007 sono indipendenti; 006 rende di più dopo 001 (più test in CI).

## Findings considered and rejected

(Registrati perché non vengano ri-auditati al prossimo giro.)

- **N+1 in `getMyLunchProposals`** (`packages/queries/src/lunch.ts:342`): reale, ma il
  commento nel codice dichiara il trade-off accettato per <100 proposte personali.
  Non vale la pena alla scala attuale.
- **Liste senza paginazione** (`getRestaurants`, `searchUsers('', 200)` in
  `/lunch`): scala attuale ~70 utenti (capienze piani 30+40). Rivalutare oltre ~200
  utenti/ristoranti.
- **Filtro in-memory in `getFloorOccupancy`** (`services/presence.ts:277`): stesso
  motivo di scala.
- **`force-dynamic` su tutte le pagine app**: dati per-sessione e quasi-realtime; ISR
  introdurrebbe staleness percepibile per benefici minimi.
- **Tailwind 3 (mobile) vs 4 (web)**: by design — NativeWind v4 richiede Tailwind 3.
- **TypeScript 5.7 (packages/web) vs 6.0 (mobile)**: default di Expo SDK 56;
  allineare ora ha costo/beneficio sfavorevole.
- **Lunch senza services layer**: decisione già registrata dal maintainer in
  `.workflow/meta.json` ("quando avrà un secondo trasporto") — diventa attuale DOPO
  il Plan 008; vedi le maintenance notes di quel piano.
- **`pnpm audit`**: 4 vulnerabilità moderate, tutte transitive su path dev/build
  (esbuild, postcss, uuid) o nell'app congelata (ws). Nessuna a runtime.
- **Vista "oggi" in HR analytics vs PRD "granularità settimanale"**: discrepanza
  reale col PRD:90 ma decisione di prodotto/DPO, non un fix — tracciata nelle
  maintenance notes del Plan 004.

## Valid but below cutoff (non pianificati, non respinti)

- **`calendar/page.tsx:681-686` interroga `db`/`schema` direttamente** bypassando
  `@desko/queries` (conteggio utenti attivi): estrazione da 30 minuti in
  `getTotalActiveUsers()` — buona prima issue.
- **Componenti probabilmente inutilizzati in `packages/ui`** (calendar, input-group,
  separator, sheet, textarea, toggle): verificare con un grep e potare.
- **`services/presence.ts` a 1040 righe**: split per concern (read/write/privacy)
  sensato ma da fare DOPO 001 (test) e 002/003 (che lo toccano).
- **Email di notifica per inviti lunch privati**: infra Resend pronta in
  `@desko/email`, manca solo il trigger in `createLunchProposal` — candidato
  naturale dopo il Plan 008.
- **Eliminare `apps/web` (MUI) congelata**: decisione aperta del maintainer in
  PLAN-NEXT; 15 minuti quando deciso.
- **`.env.example` del mobile scarno** (manca il commento su `EXPO_PUBLIC_API_URL` →
  `http://localhost:3020`): un rigo, può viaggiare col Plan 007.
