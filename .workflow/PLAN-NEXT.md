# Desko — Piano per la prossima sessione

> Snapshot al **2026-06-09**. Phase: `module-added`.
> App canonica: **`apps/web-shadcn`** (Base UI). `apps/web` (MUI) è congelata
> (vedi `apps/web/FROZEN.md`), esclusa da build/type-check root.
> Backend estratto in packages condivisi: `@desko/{db,auth,queries,server-actions,domain,email,env,ui,design-tokens}`.
> Rotte EN: `/dashboard`, `/calendar`, `/floors`, `/settings`, `/lunch`, `/admin/*`.
> Test: Vitest + PGlite a root (`pnpm test:run`), 15 test di integrazione verdi.

## Fatto rispetto al piano precedente (2026-05-09)

- ✅ **P2 — Privacy controls GDPR (US-5)**: `/settings` cablata a
  `updateVisibility` + `updateWeeklyPattern` + `archivePastPresences`
  (edit form `useEditForm`, Save dirty-gated). Filtro `presenceVisibility`
  implementato in `packages/queries/src/presence.ts` (`visibleTo()`:
  company/team/followers/hidden, self sempre visibile) e applicato a
  `getPresencesForDate`, `getPresencesForRange`, `getFollowedColleaguesWeek`.
  Coperto da test PGlite.
  - 🔧 Fix critico incluso: `archivePastPresences` aveva un where placeholder
    sempre-vero → cancellava TUTTO lo storico, anche presenze future.
- ✅ **P3 — Pattern settimanale UI**: editor giorni ricorrenti + piano
  preferito in `/settings`, persiste via `updateWeeklyPattern`.
- ✅ **P9 (metà unit)**: Vitest a root + `@desko/db/testing` (PGlite,
  migrazioni reali). Test: visibility filter (7 casi) + lunch caps/vincoli
  (8 casi). Mancano: component test (jsdom/RTL), Playwright e2e, CI.
- ✅ **P1 (parte calendar)**: `declarePresence` / `leaveOffice` / `updateFloor`
  cablati in `/calendar` (`my-presence-item.tsx`).
- ✅ Temi runtime: switcher admin via `/settings`, 4 temi
  (desko-ocra, corporate-blue, nordic-minimal, enterprice-liquid-glass),
  dark mode toggle per-utente (cookie), effetto liquid glass opt-in.
- ✅ Lunch fase 1: actions complete (proposte, join/leave con cap e 1/day,
  ristoranti + rating) + route `/lunch` con UI.

## Mobile (2026-06-10/11) — `apps/mobile`, Expo SDK 56

App completa a parità funzionale con il web per l'utente dipendente:

- ✅ **Auth**: better-auth Expo client (SecureStore), sign-in reale, AuthGuard,
  sign-out; "Password dimenticata?" apre il flow web (recovery e **signup
  restano web-only per scelta**: il flow email→link torna comunque sul browser).
- ✅ **5 tab**: Oggi (presenze + dichiara/sposta/esci) · Calendario (griglia
  mese + dichiara su data) · Piani (occupazione US-7 + "sono qui") ·
  Pranzo (proposte, partecipa/lascia/cancella, nuova proposta pubblica) ·
  Impostazioni (visibilità GDPR, pattern settimanale, oblio, profilo).
- ✅ **Architettura**: domini `presence`, `lunch` e `push` in
  `@desko/services` (puri); web actions/queries e route `/api/*` sono
  adapter sottili. 16 endpoint HTTP in web-shadcn.
- ✅ **Push notifications (base)**: tabella `push_tokens` (migrata su Neon),
  registrazione token al login (`/api/push/register`), invio via Expo Push
  API con pulizia token morti; **primo trigger**: invito a pranzo privato.
  ⚠️ Token reali richiedono EAS projectId (prima dev build EAS).
- Restano fuori per scelta: admin (web-only), temi runtime (web-only),
  rating ristoranti e proposte private da mobile (web ok), filtri US-3
  (mancano anche sul web).

## Priorità per la prossima sessione

### Priorità 1 — Dichiarazione presenze da dashboard (US-1) · **resto del blocker MVP**

Il calendar è cablato; la **dashboard no**. Manca:
1. Card "Dichiara la giornata di oggi" quando lo status è `unspecified` →
   dialog con toggle status (in_office/remote), floor picker opzionale
   (pre-selezionato da `weeklyPatterns.defaultFloor`), nota ≤140 char →
   `declarePresence`.
2. Quick action "Sposta al X piano" in dashboard → `updateFloor` (oggi no-op).
3. "Esci dall'ufficio" in dashboard → `leaveOffice`.
4. Chip "last-minute" visibile in UI (lo schema flagga già `isLastMinute`).

Nota: ogni nuovo form passa da `lib/forms` (`useCreateForm`/`useEditForm`).

#### ETA: ½-1 giorno

---

### Priorità 2 — Filtri team/persone seguite (US-3) · **"chi seguo" fatto (2026-06-11)**

- ✅ **Chi seguo**: follow/unfollow con cap 50 (servizio), gestione in
  /settings (web) e Impostazioni (mobile) con ricerca colleghi; filtro
  Tutti|Chi seguo su /calendar web (stato in URL) e su Oggi+Calendario
  mobile (segmented, useFollows lazy).
- ⏳ **Mio team**: bloccato dalla decisione open #2 (sorgente team:
  Entra ID groups o mapping HR). Il campo `user.team` esiste già.
- ⏳ **Persistenza cross-session del filtro** (acceptance PRD):
  da fare via `user.preferences` (oggi: URL su web, stato locale su mobile).
- ⏳ Filtro su `/floors`.

#### ETA residua: ½ giorno (a decisione team presa)

---

### Priorità 3 — HR analytics k-anonymity strict (US-6)

In `packages/queries/src/hr-analytics.ts`:
1. `MIN_BUCKET_SIZE` da **3 → 5** (validare con DPO, vedi decisioni open).
2. Escludere `presenceVisibility = 'hidden'` da TUTTI gli aggregati
   (oggi contano in `totalActiveUsers`).
3. Breakdown per team con suppression (<5 attivi → "altri team").
4. Test PGlite dei tre punti (l'infra c'è già).

#### ETA: ½ giorno

---

### Priorità 4 — Vista settimana calendar (US-2)

Terzo `view` in `/calendar?view=week`: 7 colonne Lun-Dom, avatar group dei
presenti per giorno. `getPresencesForRange` già filtra per visibility.

#### ETA: ½ giorno

---

### Priorità 5 — Admin "ultimo accesso"

Colonna in `/admin/users` con `session.lastUsedAt` (verificare campo nello
schema better-auth; fallback `user.updatedAt`).

#### ETA: 2 ore

---

### Priorità 6 — Test fase 2 + CI

1. Component test: jsdom + Testing Library (estendere vitest.config con
   project browser-like per `apps/web-shadcn`).
2. Playwright e2e (3 flow): signup → dichiara presenza → visibilità da altro
   utente; admin ban → login negato; lunch privato → invitato vede, altri no.
3. `module-add ci`: GitHub Actions con type-check + `pnpm test:run` su PR.

#### ETA: 1 giorno

---

### Priorità 7 — Microsoft Entra ID reale

Invariata (dipende da credenziali Azure App Registration, out-of-band):
env vars, test e2e flow, claim mapping `team`/`department`, single sign-out.

---

### Priorità 8 — Realtime ≤30s (US-2)

Approccio MVP: refresh on-focus + polling 30s sulle viste critiche.
Niente WebSocket per ora. Rispettare la skill data-fetching
(Route Handler + SWR è l'ultimo gradino, motivarlo).

#### ETA: ½ giorno

---

## Pausa pranzo · roadmap rimanente

- **Fase 2**: card "Pausa pranzo · oggi" su dashboard; sezione pranzo nella
  vista giorno calendar; tab "Settimana" + "Mie proposte" su `/lunch`.
- **Fase 3**: notifiche email Resend per invitati di proposte private;
  notifiche in-app (badge topbar); backend preferenze notifiche
  (gli switch in `/settings` sono volutamente disabilitati finché non esiste).

---

## Decisioni open dal PRD da chiarire prima del go-live

1. **DPIA / DPO** — coinvolgimento aziendale prima del lancio.
2. **Sorgente team/dipartimenti** — Entra ID groups o mapping HR? Influenza US-3.
3. **Soglia k-anonymity** — 3 oggi nel codice, PRD interpretato come 5. Validare con DPO.
4. **Cutoff "last-minute"** — implementato alle 8:00 (`LAST_MINUTE_HOUR`). Confermare.
5. **Hosting** — Azure App Service vs Vercel/Render. Influenza CI/CD.
6. **Retention TTL** — 90 giorni come da PRD? Implementare cron archive.
7. **apps/web (MUI)** — congelata il 2026-06-09; decidere se eliminarla del
   tutto a MVP shippato.
8. **Estrazione `apps/api` dedicata** — decisione legata al **primo deploy di
   produzione del mobile**. Oggi le route `/api/*` vivono in web-shadcn
   (un solo deploy, stessa origin dell'auth): accoppiamento accettato in
   sviluppo. Quando l'app mobile va in distribuzione (EAS/store), valutare
   deploy indipendente del backend HTTP per sganciare i ritmi di rilascio
   web ↔ API. Il refactor `@desko/services` (2026-06-10) rende il trasloco
   ~mezza giornata: si spostano solo route + `_lib/respond.ts`.
   Nel frattempo: CI che blocca deploy se test falliscono + API additive-only.

---

## Quick wins di rifinitura (5-30 minuti ciascuno)

- "Filtra" su `/calendar`: oggi assente/no-op → disabled con tooltip
  "presto disponibile" finché non arriva la Priorità 2.
- Bottone "Esci da tutti" in `/settings` (Sicurezza): cablare a better-auth
  `revokeSessions` o disabilitare con hint.
- Card "Sicurezza" in `/settings`: "Ultimo accesso 08:42 da Milano" è
  hardcoded — sostituire con dato reale o rimuovere.
- Verificare che `/floors` sia interamente data-driven (era mock in MUI).
