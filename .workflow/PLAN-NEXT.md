# Desko — Piano per la prossima sessione

> Stato di partenza: pause/snapshot al **2026-05-09**. Audit completo in fondo.
> Phase: `module-added`. MVP coperto al ~70%.

## Obiettivi della prossima sessione

Chiudere il **gap tra schema/server e UI** in modo che l'app sia funzionalmente
usabile da un dipendente reale. Le tabelle e le server actions ci sono già — il
lavoro è cablare la UI alle action e rispettare i requisiti GDPR/privacy del PRD.

In ordine di priorità:

### Priorità 1 — Dichiarazione presenze (US-1) · **blocker MVP**

È la **prima user story del PRD** ed è ancora completamente scoperta lato UI.
Le server actions esistono già in [lib/server/presence.ts](../apps/web/lib/server/presence.ts).

#### Cosa fare
1. **Dialog "Dichiara presenza"** richiamabile da:
   - Card su dashboard ("Dichiara la giornata di oggi") quando lo status è
     `unspecified`.
   - Bottone "+ Nuova presenza" su `/calendar` (oggi è no-op).
   - Bottone su singola cella del calendar mese (long-press / hover →
     "Dichiara per questo giorno").
   Il dialog ha:
   - Toggle status: in_office / remote / unspecified.
   - Se in_office: optional floor picker (7° / 2° / "deciderò").
   - Optional note (max 140 char).
   - Cap dichiarazioni passate? No: solo presente/futuro.
   - Submit → `declarePresence({ date, status, floor, note })`.

2. **Quick action "Sposta al X piano"** durante la giornata (già renderizzato in
   dashboard ma non collegato). Cabla a `updateFloor`.

3. **"Esci dall'ufficio"** azione → `leaveOffice()` cabla.

4. **Flag last-minute**: se `declarePresence` viene chiamata dopo le 8:00 del
   giorno corrente, lo schema già flagga `isLastMinute: true`. Verifica che il
   flag arrivi in UI (chip "last-minute" sui chip presenza in calendar).

#### Edge cases
- Utente dichiara nel passato: server action già rifiuta (validare).
- Utente sposta floor dopo aver fatto checkout: rendere idempotente.
- Utente con pattern settimanale che dichiara override giornaliero: lo schema ha
  `fromPattern: false` per override → preservare.

#### ETA: 1-2 giorni

---

### Priorità 2 — Privacy controls (US-5) · **blocker GDPR**

#### Cosa fare
1. **Pagina /impostazioni cablata** alle server actions reali. Oggi è 775
   righe di UI mock con `useState` locale. Servono:
   - `updateVisibility({ visibility })` → controllo "company / team / followers / hidden".
   - Editor pattern settimanale → `updateWeeklyPattern`.
   - Default floor → campo `user.defaultFloor`.
   - Diritto all'oblio: bottone "Cancella il mio storico presenze" che chiama
     `archivePastPresences()`.
2. **Server-side filter rispetta visibility**: `getPresencesForDate` deve
   nascondere/mostrare in base a `presenceVisibility`. Oggi mostra tutti.
   Implementazione:
   - `hidden` → escluso completamente.
   - `team` → mostrato solo a chi ha lo stesso `team` campo.
   - `followers` → mostrato solo a `followers` (relazione `follows`).
   - `company` → tutti gli utenti attivi.

#### ETA: 1 giorno

---

### Priorità 3 — Pattern settimanale ricorrente UI (US-1)

Connettere [impostazioni/page.tsx](../apps/web/app/(app)/impostazioni/page.tsx) →
`updateWeeklyPattern`. UI esiste già come chip-selector mock; serve solo
cablare l'onChange + submit.

#### ETA: ½ giorno

---

### Priorità 4 — Filtri team/persone seguite (US-3)

#### Cosa fare
1. Su `/calendar` (sia mese sia giorno): bottone "Filtra" deve aprire un dialog
   con tre opzioni:
   - Tutto il company
   - Solo il mio team (auto-determinato da `user.team`)
   - Solo le persone che seguo (relazione `follows`)
   - + Multi-select persone specifiche (autocomplete su utenti)
2. Filtro persistente: salvarlo in `localStorage` per ora (sufficiente, MVP);
   migrazione a `user.preferences` JSON post-MVP.
3. Pagina `/piani` ha la stessa logica di filtri.

#### ETA: 1 giorno

---

### Priorità 5 — HR analytics k-anonymity strict (US-6)

#### Cosa fare
1. Soglia minima da **3** → **5** in [lib/queries/hr-analytics.ts](../apps/web/lib/queries/hr-analytics.ts).
2. Esclusione utenti `presenceVisibility = 'hidden'` da TUTTI gli aggregati
   (oggi compaiono nel `totalActiveUsers`).
3. Breakdown per team con suppression: aggregato per team se team ha ≥5 attivi,
   altrimenti rolled up in "altri team".

#### ETA: ½ giorno

---

### Priorità 6 — Vista settimana calendar

PRD US-2 chiede "questa settimana / prossima settimana" oltre a oggi/domani.
Aggiungere un terzo `view` in `/calendar?view=week&...`:
- 7 colonne (Lun-Dom)
- Per ogni giorno: avatar group dei presenti
- Header simile a vista mese ma più compatto

#### ETA: ½ giorno

---

### Priorità 7 — Admin "ultimo accesso"

Colonna in `/admin/users` che join con `session.lastUsedAt` (campo da verificare
nel schema better-auth). Se non c'è, usare `user.updatedAt` come proxy
(meno preciso).

#### ETA: 2 ore

---

### Priorità 8 — Microsoft Entra ID reale

Quando ci sono credenziali Azure App Registration:
1. Valorizzare `MICROSOFT_CLIENT_ID/SECRET/TENANT_ID` in `.env.local`.
2. Test login flow end-to-end.
3. Verifica claim mapping: `name`, `email`, `team` (da `groups` o `department`?
   open question PRD #2).
4. Single sign-out: revoca su Entra → revoca su Desko al refresh.

#### ETA: dipende da approvazione Azure (out-of-band)

---

### Priorità 9 — Tests + CI · **non bloccante MVP**

#### Cosa fare
1. `module-add test` (Vitest + Playwright).
2. Test critici Vitest:
   - `lib/queries/presence.ts` — visibility filter, day grouping.
   - `lib/server/lunch.ts` — cap participants, private invite, vincolo 1/day.
3. Playwright E2E (3 flow):
   - signup → declare presence today → verifica visibilità a un altro user.
   - admin: ban user → user non può fare login.
   - lunch: crea proposta privata → invitato la vede, altri no.
4. `module-add ci` (GitHub Actions): typecheck + test su ogni PR.

#### ETA: 1-2 giorni

---

### Priorità 10 — Realtime ≤30s

PRD US-2 chiede "≤30s near-real-time". Approccio MVP: refetch lato client ogni
30s con `swr` o `react-query` su `getPresencesForDate`. Niente WebSocket per
ora.

Alternativa: forzare `revalidatePath` ogni X secondi via `unstable_noStore` su
viste critiche e refresh on-focus. Più leggero.

#### ETA: ½ giorno (con polling) / 1-2 giorni (con SSE)

---

## Pausa pranzo · roadmap rimanente

- **Fase 2** (post Priorità 1-5):
  - Card "Pausa pranzo · oggi" sulla dashboard
  - Sezione "Pranzo del giorno" nella vista giorno calendar
  - Tab "Settimana" + "Mie proposte" su `/lunch`
- **Fase 3**:
  - Notifiche email Resend per gli invitati di proposte private
  - Cap max partecipanti UI
  - Notifiche in-app (badge in topbar)

---

## Decisioni open dal PRD da chiarire prima del go-live

1. **DPIA / DPO** — coinvolgimento aziendale prima del lancio.
2. **Sorgente team/dipartimenti** — Entra ID groups o mapping HR? Influenza US-3.
3. **Soglia k-anonymity** — la mia interpretazione del PRD è 5. Validare con DPO.
4. **Cutoff "last-minute"** — proposta: dichiarazioni dopo le 8:00 del giorno
   stesso → flag visuale. Confermare orario.
5. **Hosting** — Azure App Service vs Vercel/Render. Influenza CI/CD.
6. **Retention TTL** — 90 giorni come da PRD? Implementare cron archive.

---

## Quick wins di rifinitura (5-30 minuti ciascuno)

- Spostare "Filtra" su `/calendar` da no-op → disabled con tooltip "presto disponibile" finché non implementiamo filtri reali.
- Dashboard "Sposta al 7°" cabla a `updateFloor`.
- Pagina `/piani`: verificare se è data-driven o ancora mock.
- Showcase page (`/app/showcase`): rimuovere Stack divider hydration risk se ancora presente.
- Lunch: counter "+N" testo dopo AvatarGroup ovunque (già fatto in calendar, replicare in eventuali altri spot).
