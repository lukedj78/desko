# Plan 005: Sanitizzare gli errori delle API REST e aggiungere gli error boundary

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 622c4d8..HEAD -- apps/web-shadcn/app/api/_lib apps/web-shadcn/app/error.tsx apps/web-shadcn/app/\(app\)`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-tests-presence-services-api.md
- **Category**: security
- **Planned at**: commit `622c4d8`, 2026-06-11

## Why this matters

Le route REST per il mobile rispondono agli errori imprevisti con il messaggio grezzo
dell'eccezione: un errore Drizzle/Postgres non gestito arriverebbe al client con nomi
di tabelle e constraint (information disclosure). In parallelo, l'app web canonica non
ha **nessun** `error.tsx`: un throw in una pagina server (es. `getCurrentUserId` che
lancia `UNAUTHORIZED`, o un errore DB) produce il 500 nudo di Next senza UI di
recupero. Due fix piccoli e indipendenti tra loro, stessa area: il contratto di errore.

## Current state

- `apps/web-shadcn/app/api/_lib/respond.ts` — intero file, 29 righe. La funzione da
  correggere:

  ```ts
  /** Errori thrown (getCurrentUserId, bug): 401 per UNAUTHORIZED, altrimenti 500. */
  export function errorResponse(e: unknown) {
    const message = e instanceof Error ? e.message : 'INTERNAL_ERROR';
    return NextResponse.json(
      { error: message },
      { status: message === 'UNAUTHORIZED' ? 401 : 500 },
    );
  }
  ```

  Tutte le route `app/api/presence/*/route.ts` la usano nel `catch`. Gli errori di
  business/validazione NON passano di qui: viaggiano come `ActionResult.ok === false`
  → `actionResponse` → 400 (quello resta invariato).
- Il client mobile (`apps/mobile/lib/api.ts`) controlla `body.error` e per il 401 si
  aspetta **esattamente** la stringa `'UNAUTHORIZED'` — il contratto 401 non deve
  cambiare.
- `find apps/web-shadcn/app -name 'error.tsx'` → nessun risultato. Il root layout è
  `app/layout.tsx` (theming via cookie); il gruppo autenticato è `app/(app)/layout.tsx`
  con la shell `components/shared/shell/app-shell.tsx`. UI kit: componenti da
  `@desko/ui/components/*` (es. `import { Button } from '@desko/ui/components/button';`
  come in `app/(app)/calendar/page.tsx:16`), icone `lucide-react`, testi UI in italiano.
- Dopo il Plan 001 esiste `apps/web-shadcn/app/api/__tests__/presence-routes.test.ts`
  e il vitest root raccoglie i test sotto `apps/web-shadcn/**`.

## Commands you will need

| Purpose   | Command                                | Expected on success |
|-----------|----------------------------------------|---------------------|
| Typecheck | `pnpm type-check`                      | exit 0              |
| Tests     | `pnpm test:run -- apps/web-shadcn`     | tutti verdi         |
| Dev       | `pnpm --filter @desko/web-shadcn dev`  | server su :3020     |

## Scope

**In scope**:
- `apps/web-shadcn/app/api/_lib/respond.ts`
- `apps/web-shadcn/app/error.tsx` (create)
- `apps/web-shadcn/app/(app)/error.tsx` (create)
- `apps/web-shadcn/app/api/__tests__/presence-routes.test.ts` (estendere)

**Out of scope**:
- `actionResponse` e il contratto 400 (`{ error, fieldErrors }`) — il mobile ci fa
  affidamento.
- Le singole route handler (nessun cambiamento ai loro try/catch).
- `apps/web` (congelata) — ha un suo `app/error.tsx`: NON copiarlo, è MUI.

## Git workflow

- Branch: `fix/api-error-hardening`
- Commit per step; stile: `fix(api): errorResponse non espone più i dettagli interni`
- Non pushare né aprire PR se non richiesto.

## Steps

### Step 1: Sanitizzare `errorResponse`

Sostituisci la funzione in `respond.ts` con:

```ts
/**
 * Errori thrown (getCurrentUserId, bug): 401 per UNAUTHORIZED, altrimenti 500
 * generico. Il dettaglio NON va al client (information disclosure): finisce
 * nel log server.
 */
export function errorResponse(e: unknown) {
  const message = e instanceof Error ? e.message : 'INTERNAL_ERROR';
  if (message === 'UNAUTHORIZED') {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  console.error('[api] errore non gestito:', e);
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
}
```

**Verify**: `pnpm type-check` → exit 0.

### Step 2: Test del nuovo contratto

In `apps/web-shadcn/app/api/__tests__/presence-routes.test.ts` aggiungi:

1. Il caso 401 esistente resta verde (body esattamente `{ error: 'UNAUTHORIZED' }`).
2. Nuovo test: il mock di `getCurrentUserId` lancia
   `new Error('duplicate key value violates unique constraint "presence_entries_user_id_date_unique"')`;
   chiama `GET today` → status 500 e body `{ error: 'INTERNAL_ERROR' }` — il messaggio
   della constraint NON compare nel body (`expect(JSON.stringify(body)).not.toContain('constraint')`).

**Verify**: `pnpm test:run -- apps/web-shadcn` → tutti verdi.

### Step 3: Error boundary root

Crea `apps/web-shadcn/app/error.tsx`:

```tsx
'use client';

import { Button } from '@desko/ui/components/button';

/** Error boundary root: qualunque throw non gestito nelle pagine finisce qui. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Qualcosa è andato storto</h1>
      <p className="text-muted-foreground">
        Riprova tra qualche istante. Se il problema persiste, ricarica la pagina.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Riprova</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
          Torna alla dashboard
        </Button>
      </div>
    </main>
  );
}
```

Adatta le classi ai token effettivamente usati nel progetto se `text-muted-foreground`
non esiste in `globals.css` (grep prima di inventare). Non loggare `error.message`
nel DOM.

Crea `apps/web-shadcn/app/(app)/error.tsx` con lo stesso componente ma senza
`min-h-dvh` (renderizza dentro la shell): stesso file, layout più compatto.

**Verify**: `pnpm type-check` → exit 0. Smoke: avvia il dev server, lancia
temporaneamente un `throw new Error('test')` in cima a `app/(app)/dashboard/page.tsx`,
verifica che compaia il boundary (non il 500 di default), poi RIMUOVI il throw.

## Test plan

- Step 2: 2 test sul contratto errori (401 invariato, 500 sanitizzato).
- Smoke manuale del boundary (Step 3) — i component test jsdom non sono wired nel
  repo, non introdurli qui.
- Verifica: `pnpm test:run` → exit 0.

## Done criteria

- [ ] `pnpm type-check` exit 0
- [ ] `pnpm test:run` exit 0, incluso il test "il body 500 non contiene il messaggio interno"
- [ ] `grep -n "e.message\|message ===" apps/web-shadcn/app/api/_lib/respond.ts` mostra
      che `message` non viene mai messo nel body se non è `UNAUTHORIZED`
- [ ] Esistono `app/error.tsx` e `app/(app)/error.tsx`, entrambi `'use client'`
- [ ] Il throw di prova in dashboard è stato rimosso (`git status` pulito fuori scope)
- [ ] Riga di stato aggiornata in `plans/README.md`

## STOP conditions

- Il Plan 001 non risulta DONE (serve l'infra test per le route).
- Il client mobile risulta dipendere da messaggi di errore 500 specifici (grep
  `INTERNAL_ERROR` e gestione errori in `apps/mobile/lib/api.ts` prima di cambiare:
  oggi mostra `body.error` generico, va bene).
- I componenti `@desko/ui` richiesti non esistono con quelle API.

## Maintenance notes

- Quando nascerà `/api/lunch/*` (Plan 008) DEVE riusare `actionResponse`/`errorResponse`
  da `_lib/respond.ts` — reviewer: respingere route con `catch` artigianali.
- Follow-up esplicitamente fuori scope: logging strutturato (oggi `console.error`
  basta; rivalutare al primo deploy con un log drain).
