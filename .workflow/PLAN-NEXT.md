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

### Priorità 2 — Filtri team/persone seguite (US-3)

Su `/calendar` e `/floors`: filtro "Tutti / Mio team / Chi seguo / persone
specifiche". Stato filtro in URL `searchParams` (skill data-fetching),
NON localStorage. Le relazioni `follows` e le query esistono già.

#### ETA: 1 giorno

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

---

## Quick wins di rifinitura (5-30 minuti ciascuno)

- "Filtra" su `/calendar`: oggi assente/no-op → disabled con tooltip
  "presto disponibile" finché non arriva la Priorità 2.
- Bottone "Esci da tutti" in `/settings` (Sicurezza): cablare a better-auth
  `revokeSessions` o disabilitare con hint.
- Card "Sicurezza" in `/settings`: "Ultimo accesso 08:42 da Milano" è
  hardcoded — sostituire con dato reale o rimuovere.
- Verificare che `/floors` sia interamente data-driven (era mock in MUI).
