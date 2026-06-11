# Plan 008: Lunch su mobile — endpoint REST /api/lunch/* e tab Pranzo (lettura + join)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 622c4d8..HEAD -- apps/web-shadcn/app/api packages/server-actions/src/lunch.ts packages/queries/src/lunch.ts apps/mobile`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/005-api-error-hardening.md (contratto errori) — consigliato anche 001
- **Category**: direction
- **Planned at**: commit `622c4d8`, 2026-06-11

## Why this matters

Il lunch è feature-completa sul web (proposte pubbliche/private con cap, join/leave,
ristoranti con rating) ma invisibile sul mobile, dove il pranzo è il caso d'uso più
"in movimento" di tutti. Tutta la logica esiste già in `@desko/queries/lunch` e
`@desko/server-actions/lunch`: mancano solo gli adapter HTTP (lo stesso pattern già
rodato per `/api/presence/*`) e una tab mobile. Scope deliberatamente MVP: vedere le
proposte di oggi/domani e fare join/leave. La **creazione** di proposte da mobile è
fase 2, fuori scope.

## Current state

- Pattern adapter HTTP già rodato — `apps/web-shadcn/app/api/presence/declare/route.ts`:

  ```ts
  export async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      return actionResponse(await declarePresence(body));
    } catch (e) {
      return errorResponse(e);
    }
  }
  ```

  Helper in `apps/web-shadcn/app/api/_lib/respond.ts` (`actionResponse` mappa
  `ActionResult` su 200/400; `errorResponse` su 401/500 — dopo il Plan 005 il 500 è
  sanitizzato).
- Lato dominio (da riusare, NON reimplementare):
  - `packages/queries/src/lunch.ts` — `getRestaurants()` (:98),
    `getLunchProposalsForDate(date?)` (:215, default oggi; applica già la visibilità
    public/private+invito rispetto all'utente della sessione via `getCurrentUserId`),
    `getMyLunchProposals()` (:342). Tipi: `ProposalSummary`, `RestaurantWithRating`.
  - `packages/server-actions/src/lunch.ts` — `joinLunchProposal` (:262),
    `leaveLunchProposal` (:338), `cancelLunchProposal` (:372), `createLunchProposal`
    (:181), `rateRestaurant` (:128), `addRestaurant` (:83). Firme: leggile nel file
    prima di scrivere le route (prendono input object e ritornano `ActionResult`).
- Mobile, pattern dati — `apps/mobile/app/(app)/(tabs)/_components/use-presence-today.ts`:
  hook TanStack Query su `api.get/post` di `apps/mobile/lib/api.ts` (fetch con cookie
  better-auth da SecureStore; `ApiError` con `status` e `fieldErrors`). Il
  `QueryClientProvider` è già montato (vedi `apps/mobile/app/_layout.tsx`).
- Mobile, tab esistenti — `apps/mobile/app/(app)/(tabs)/_layout.tsx`: tre
  `Tabs.Screen` (index/Oggi, calendar/Calendario, settings/Impostazioni) con icone
  `Ionicons` e palette inline (`OCRA = '#E8B931'`).
- Stile mobile: NativeWind 4 (className), componenti presentational separati in
  `_components/` (vedi `my-day-card.tsx`, `month-grid.tsx`).
- La pagina web `/lunch` (`apps/web-shadcn/app/(app)/lunch/page.tsx`) mostra oggi +
  domani: replica la stessa scelta sul mobile.

## Commands you will need

| Purpose   | Command                                | Expected on success |
|-----------|----------------------------------------|---------------------|
| Typecheck | `pnpm type-check`                      | exit 0              |
| Tests     | `pnpm test:run`                        | tutti verdi         |
| Web dev   | `pnpm --filter @desko/web-shadcn dev`  | server su :3020     |
| Mobile    | `pnpm --filter @desko/mobile dev`      | Expo dev server     |

## Scope

**In scope**:
- `apps/web-shadcn/app/api/lunch/today/route.ts` (create) — GET, proposte per data
- `apps/web-shadcn/app/api/lunch/join/route.ts` (create) — POST
- `apps/web-shadcn/app/api/lunch/leave/route.ts` (create) — POST
- `apps/web-shadcn/app/api/restaurants/route.ts` (create) — GET
- `apps/web-shadcn/app/api/__tests__/lunch-routes.test.ts` (create)
- `apps/mobile/app/(app)/(tabs)/_layout.tsx` (aggiungere la tab)
- `apps/mobile/app/(app)/(tabs)/lunch.tsx` (create)
- `apps/mobile/app/(app)/(tabs)/_components/use-lunch.ts` (create)
- `apps/mobile/app/(app)/(tabs)/_components/lunch-proposal-card.tsx` (create)

**Out of scope**:
- Creazione/cancellazione proposte e rating da mobile (fase 2).
- `packages/queries/src/lunch.ts` e `packages/server-actions/src/lunch.ts` — solo
  consumo. Se una firma non si presta all'HTTP, STOP (vedi sotto), non modificarla.
- Notifiche email per gli invitati (finding separato, non pianificato).
- `proxy.ts` (gestisce già il 401 JSON per `/api/*`).

## Git workflow

- Branch: `feat/lunch-mobile`
- Commit per step; stile: `feat(api): endpoint REST /api/lunch/*` /
  `feat(mobile): tab Pranzo con join/leave`
- Non pushare né aprire PR se non richiesto.

## Steps

### Step 1: Endpoint REST

Quattro route, tutte copiando ESATTAMENTE il pattern try/catch + `actionResponse`/
`errorResponse` di `app/api/presence/*`:

1. `GET /api/lunch/today?date=YYYY-MM-DD` — `date` opzionale (default oggi, come fa
   `getLunchProposalsForDate`). Valida il formato con la stessa regex di
   `app/api/presence/range/route.ts` se il param è presente. Risposta:
   `NextResponse.json({ proposals })`.
2. `GET /api/restaurants` — `NextResponse.json({ restaurants: await getRestaurants() })`.
3. `POST /api/lunch/join` — body passato a `joinLunchProposal`, via `actionResponse`.
4. `POST /api/lunch/leave` — idem con `leaveLunchProposal`.

Leggi le firme reali delle due action prima di scrivere (il body del client deve
combaciare col loro input). Commento di testa in italiano su ogni route, come nelle
route presence.

**Verify**: `pnpm type-check` → exit 0.

### Step 2: Test delle route

Crea `apps/web-shadcn/app/api/__tests__/lunch-routes.test.ts` sul pattern di
`presence-routes.test.ts` (Plan 001; mock PGlite + auth hoisted + `next/cache`).
Fixture: 2 utenti, 1 ristorante, 1 proposta pubblica di oggi con cap 4.
Casi (≈8): `GET today` con sessione → 200 con la proposta; senza sessione → 401;
`GET restaurants` → 200 con 1 ristorante; `POST join` happy → 200 e partecipante
scritto su DB; join oltre il cap → 400; `POST leave` happy → 200; join senza
sessione → 401; `date` malformata su today → 400.

**Verify**: `pnpm test:run -- apps/web-shadcn` → tutti verdi.

### Step 3: Hook dati mobile

Crea `use-lunch.ts` modellato su `use-presence-today.ts`:

- `useLunchProposals(date?: string)` — `useQuery({ queryKey: ['lunch', date ?? 'today'], queryFn: () => api.get('/api/lunch/today' + (date ? `?date=${date}` : '')) })`.
- `useRestaurants()` — query su `/api/restaurants`, `staleTime` lungo (es. 1h).
- `useJoinLunch()` / `useLeaveLunch()` — mutation che su success invalida
  `['lunch']` (`queryClient.invalidateQueries({ queryKey: ['lunch'] })`).

Tipa le risposte importando i tipi da `@desko/queries/lunch`? NO — `@desko/queries`
importa `@desko/db` (server-only) e NON è una dependency del mobile: dichiara nel
hook i tipi minimi del payload (id, restaurant {name, emoji, priceRange}, meetingTime,
participants, capacity, visibility, createdBy) ricalcando `ProposalSummary`, come già
fa `use-presence-today.ts` per i suoi tipi.

**Verify**: `pnpm type-check` → exit 0.

### Step 4: Tab e UI

1. In `_layout.tsx` aggiungi `<Tabs.Screen name="lunch" options={{ title: 'Pranzo', tabBarIcon: ... }}/>`
   (icona `restaurant-outline`, stesso pattern delle altre) tra calendar e settings.
2. `lunch.tsx`: schermata con due sezioni "Oggi" e "Domani" (calcola domani con la
   convenzione data del repo — `addDaysIso(todayIso(), 1)` da `@desko/domain` se il
   Plan 002 è DONE, altrimenti la convenzione locale corrente di `lib/api.ts`).
   Stati: loading (spinner), errore (`ApiError.message`), lista vuota ("Nessuna
   proposta"). Lista con `lunch-proposal-card.tsx`.
3. `lunch-proposal-card.tsx` (presentational): emoji + nome ristorante, orario,
   partecipanti `n/cap`, badge "Privata" se visibility private, bottone
   Unisciti/Lascia secondo se l'utente è tra i partecipanti (il payload espone i
   partecipanti: confronta con l'id utente di sessione — recupera come fa la tab
   Oggi; se la tab Oggi non espone l'id, usa il flag equivalente presente nel payload
   di `ProposalSummary`, leggilo dal tipo reale). Disabilita il bottone durante la
   mutation; su `ApiError` mostra il messaggio (è il contratto 400 di business:
   cap pieno, già partecipante, ecc.).

**Verify**: `pnpm type-check` → exit 0. Smoke end-to-end: web dev su :3020 con DB
raggiungibile, Expo avviato, login, tab Pranzo → vedi le proposte create da web,
join → su web il partecipante compare. Se non hai un device/simulatore o un DB,
salta lo smoke e dichiaralo nel report.

## Test plan

- Step 2: ~8 test di integrazione sulle route (business rules incluse: cap, 401, 400).
- UI mobile: niente test automatici (nessuna infra RN test nel repo — non introdurla).
- Verifica: `pnpm test:run` → exit 0.

## Done criteria

- [ ] `pnpm type-check` exit 0
- [ ] `pnpm test:run` exit 0, incluso `lunch-routes.test.ts`
- [ ] Le 4 route esistono e usano `actionResponse`/`errorResponse` (grep nei file)
- [ ] La tab Pranzo esiste con stati loading/errore/vuoto/lista
- [ ] Nessuna modifica a `packages/queries` o `packages/server-actions` (`git status`)
- [ ] Riga di stato aggiornata in `plans/README.md`

## STOP conditions

- Le firme di `joinLunchProposal`/`leaveLunchProposal` o il tipo `ProposalSummary`
  non combaciano con quanto descritto (drift) e l'adattamento richiederebbe di
  modificare i packages.
- `getLunchProposalsForDate` non applica la visibilità delle proposte private
  rispetto alla sessione (verificalo leggendo il file): esporla via HTTP sarebbe un
  leak — fermati e riporta.
- Il Plan 005 non è DONE e `errorResponse` espone ancora `e.message` — esegui prima
  quello.

## Maintenance notes

- Fase 2 esplicitamente rimandata: creazione proposta da mobile (serve un picker
  ristorante/orario), rating, cancel. Gli endpoint per cancel/rate si aggiungono con
  lo stesso pattern quando serviranno.
- Quando il lunch avrà il secondo trasporto (queste route), vale la nota del
  maintainer in `.workflow/meta.json`: valutare l'estrazione di
  `packages/services/src/lunch.ts` sul modello di presence.
- Reviewer: controllare che la tab non importi nulla da `@desko/queries` (server-only).
