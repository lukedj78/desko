# Desko — PRD

## Problem

Marco lavora in remoto da Bologna e una volta ogni due settimane prende il treno per Milano. Stamani è in ufficio dalle 9: il suo team product è in remoto, il designer con cui doveva fare review è a casa malato, e i colleghi di altri team che incrocia in cucina sono un sample casuale di sei persone che non conosce. Alle 17 torna in stazione pensando "potevo lavorare da casa".

Questa scena ha tre conseguenze a catena: (1) Marco riduce la sua frequenza di presenza, (2) il prossimo che valuta se venire trova ancora meno colleghi, (3) la giornata in ufficio perde qualità sociale, che era il suo unico vantaggio rispetto al remoto.

Oggi le informazioni "chi sarà in ufficio quando" circolano in canali frammentati (Teams, gruppi WhatsApp, scambi offline) — utili per il proprio sotto-team se ben coordinato, inutili per chi non sa dove guardare. Manca un punto unico, leggero, **consultabile prima** di prendere il treno.

## Solution overview

Desko è un'app web mobile-first che fa una cosa sola e bene: ogni dipendente segna i giorni in cui sarà in ufficio (con possibilità di pattern ricorrenti), e tutti vedono in tempo reale chi ci sarà nei prossimi giorni. Login via SSO aziendale Microsoft, profilo collegato all'identità Entra ID, niente password locali.

Le tre interazioni core sono asimmetriche per frequenza:

1. **Dichiarare** (azione meno frequente) — un'interazione settimanale, fatta al volo da mobile, in cui imposti i giorni della settimana corrente o successive. Sticky: è facile lasciare invariato un pattern.
2. **Consultare** (azione più frequente) — ogni volta che valuti se venire in ufficio, apri Desko e vedi una vista per giorno con elenco/avatar dei colleghi presenti. Filtri per team, per persone seguite, o vista globale.
3. **Coordinare** (azione emergente) — quando vedi che un collega importante è in ufficio un giorno, decidi di esserci anche tu. Il prodotto non spinge nulla; rende il segnale visibile.

A questo si aggiunge un asse **spaziale leggero**: l'azienda ha due aree di lavoro distinte (7° Piano con stanza, 2° Piano con co-working e bar). Quando dichiari la presenza, puoi opzionalmente indicare in quale piano sei e aggiornarlo durante la giornata se ti sposti. Non è desk booking — è un'informazione contestuale che aiuta i colleghi a capire se siete nello stesso spazio o se scendere/salire ha senso.

L'esperienza è volontaria, non gamificata, e privacy-first: ogni utente controlla la granularità di chi può vedere le sue presenze (vedi US-5).

Una vista aggregata in sola lettura è disponibile per le HR (vedi US-6), strettamente anonimizzata e con soglie minime di k-anonymity per evitare re-identificazione.

## User stories (MVP)

- **US-1.** Come dipendente, voglio dichiarare in quali giorni sarò in ufficio (singoli o ricorrenti, con possibilità di indicare il piano), così che i colleghi lo sappiano in anticipo.
  - Acceptance:
    - Posso marcare un singolo giorno come "in ufficio", "in remoto", o "non specificato" (default).
    - Quando dichiaro "in ufficio" posso **opzionalmente** indicare il piano: `7° Piano (stanza)` oppure `2° Piano (Co-working)`. Il campo è facoltativo: posso dichiarare la presenza senza specificarlo.
    - Posso impostare un pattern ricorrente settimanale (es. "ogni martedì e giovedì in ufficio") che si applica automaticamente alle settimane future fino a revoca.
    - Posso sovrascrivere il pattern ricorrente per una settimana specifica senza perderlo.
    - Posso modificare la mia presenza fino al giorno stesso (entro orario di apertura ufficio); modifiche oltre quella soglia sono possibili ma evidenziate come "last-minute".
    - L'azione di dichiarazione si completa in ≤2 tap su mobile per il caso "ricorrente già impostato + conferma settimana".

- **US-2.** Come dipendente, voglio vedere chi sarà in ufficio in un dato giorno, così che possa decidere se venire.
  - Acceptance:
    - Vista "oggi", "domani", "questa settimana", "prossima settimana" accessibile in homepage.
    - Per ogni giorno mostra elenco/avatar dei dipendenti che hanno dichiarato "in ufficio" in quel giorno, ordinati per rilevanza (vedi US-3).
    - Vedo numero totale e separazione tra "dichiarati certi" e "ricorrenti non confermati".
    - La vista si aggiorna in near-real-time (≤30s) quando un collega cambia stato.
    - Se un utente non ha dichiarato nulla, non appare nelle liste (no fallback a "presunto remoto").

- **US-3.** Come dipendente, voglio filtrare la vista presenze per team/persone di interesse, così che il segnale sia rilevante e non rumore.
  - Acceptance:
    - Posso seguire colleghi specifici (lista personale, max ~50).
    - Posso filtrare per team/dipartimento (l'appartenenza arriva da Entra ID o da configurazione manuale).
    - Esiste una vista "il mio team" come default suggerito al primo login.
    - I filtri persistono cross-session sul mio profilo.

- **US-4.** Come dipendente, voglio autenticarmi con il mio account aziendale Microsoft (Entra ID + MFA via Microsoft Authenticator) **oppure** con email/password classica (per testing e per utenti senza account Entra ID), così che l'accesso sia sicuro e flessibile.
  - Acceptance:
    - **Metodo A — Microsoft Entra ID (target produzione)**: SSO via OIDC/OAuth2. Profilo (nome, foto, email, team) sincronizzato dal claim Entra ID. MFA gestita dalla policy aziendale via Microsoft Authenticator (Desko non implementa MFA proprio).
    - **Metodo B — Email + password (fallback / dev / testing)**: signup self-service con email-verify, signin, reset password via email. Password con regole standard (≥8 char, no breach check ora ma plug-in disponibile).
    - I due metodi possono **coesistere**: stesso `userId` in db, account multipli (uno per provider) collegati allo stesso user record.
    - Logout invalida la sessione lato app. Revoca lato Entra ID disconnette anche Desko al refresh successivo.
    - Signup self-service è **temporaneo** (per fase di test). In produzione resterà solo Microsoft + invito-only via admin (vedi US-8).
  - **Open question** (vedi sezione dedicata): definizione tecnica esatta del flusso Entra ID (OIDC PKCE, scopes, claim mapping, refresh token strategy) — verrà completata quando si configurerà l'app registration in Azure.

- **US-8.** Come amministratore, voglio gestire utenti, ruoli e permessi della piattaforma, così che l'accesso a funzionalità sensibili (es. vista HR aggregata, ban di account compromessi) sia controllato e auditable.
  - Acceptance:
    - Pagina `/admin/users` accessibile solo a utenti con ruolo `admin` (middleware redirect altrimenti).
    - Lista utenti con: avatar, nome, email, provider (microsoft / credentials), ruolo, ultimo accesso, stato (attivo / bannato).
    - Azioni admin: assegna/cambia ruolo (`user` / `admin` / `hr_analytics`), banna utente (con `banReason` + `banExpires`), revoca sessioni attive, impersonate (per supporto/debug).
    - **Bootstrap**: un super-admin viene seedato all'inizializzazione del db (default: `admin@desko.local` / `demo123` — da cambiare in produzione).
    - **Audit log** delle azioni admin (chi ha bannato chi, quando) — Post-MVP se non semplice da abilitare di default.
    - Le azioni admin **non bypassano** la US-5 visibility: un admin non vede le presenze di chi è in modalità incognito (controllo applicativo, anche se admin tecnicamente potrebbe leggere il db direttamente).
  - **Ruoli minimi MVP**:
    - `user` (default per ogni nuovo signup)
    - `admin` (gestione utenti)
    - `hr_analytics` (US-6 vista aggregata HR)

- **US-5.** Come dipendente, voglio decidere chi può vedere le mie presenze, così che la mia privacy sia rispettata.
  - Acceptance:
    - Default suggerito: visibile a tutti i dipendenti dell'azienda (sotto SSO).
    - Opzioni alternative: visibile solo al mio team, visibile solo a colleghi che mi seguono, completamente nascosto (modalità incognito).
    - Posso cambiare l'impostazione in qualsiasi momento; il cambio si applica a tutti i dati passati e futuri.
    - Posso eliminare lo storico delle mie presenze passate (diritto all'oblio GDPR).
    - L'impostazione è chiaramente esposta nel profilo, non nascosta in setting di terzo livello.

- **US-6.** Come HR, voglio una vista aggregata e anonimizzata dei tassi di occupazione dell'ufficio, così che possa supportare decisioni su spazi/giornate tematiche senza monitorare le persone.
  - Acceptance:
    - Vista accessibile solo a un piccolo set di account con ruolo `hr_analytics` (assegnato manualmente dall'admin).
    - Mostra **solo aggregati**: % di dipendenti dichiarati in ufficio per giorno, trend settimanale/mensile, breakdown per team.
    - **Mai nominativi**, mai liste di persone, mai vista per dipendente.
    - Soglia di k-anonymity: nessun aggregato esposto se la cella ha <5 dipendenti (es. team da 3 persone → il loro tasso non è mostrato singolarmente, viene rollato in "altri team").
    - Gli utenti che hanno scelto "modalità incognito" in US-5 sono esclusi anche dagli aggregati.
    - I dati esposti hanno granularità minima settimanale (no realtime per evitare re-identificazione "chi è venuto oggi?").

- **US-7.** Come dipendente in ufficio, voglio indicare e aggiornare in quale piano sto lavorando (7° Piano stanza / 2° Piano Co-working), così che i colleghi sappiano se siamo nello stesso spazio e possano coordinarsi o spostarsi.
  - Acceptance:
    - Quando dichiaro "in ufficio" per oggi posso indicare il piano (campo opzionale, due valori: `7th_floor` / `2nd_floor`).
    - Posso aggiornare il piano in qualsiasi momento durante la giornata (es. scendo dal 7° al 2° dopo pranzo). L'aggiornamento è istantaneo e visibile ai colleghi entro 30s.
    - Solo l'**ultimo piano dichiarato** viene mostrato (no storico intra-giornata, no "è stato qui dalle 9 alle 13"). Si memorizza un timestamp `lastFloorUpdateAt` per mostrare "aggiornato 5 min fa".
    - Il piano eredita la stessa visibilità della presenza (US-5): se nascondo la presenza, nascondo anche il piano.
    - Le viste "Oggi" e "Piani" raggruppano i colleghi per piano dichiarato; chi non ha specificato un piano appare in una sezione "In ufficio · piano non indicato".
    - Posso impostare un piano preferito di default nelle impostazioni (es. "Solitamente sto al 7°"), che viene preselezionato ma sempre modificabile.

## Post-MVP (esplicitamente fuori dall'MVP)

- **Integrazione Outlook** — sincronizzazione bidirezionale tra eventi Outlook "in office" e Desko. Riconosciuto utile, ma rinviato alla fase 2 per non bloccare l'MVP su un'integrazione enterprise.
- **Notifiche push proattive** ("il tuo team è in ufficio mercoledì") — da valutare dopo aver misurato il pattern di consultazione organico, per non rendere il prodotto "noisy" prima del tempo.
- **Suggerimenti di lunch / coffee** — il prodotto MVP rende il segnale visibile, non aggiunge layer sociale strutturato.
- **Multi-sede** — al momento la sede è solo Milano; se in futuro l'azienda apre altre sedi, va aggiunta una dimensione "location" alla dichiarazione di presenza.
- **App native iOS/Android** — il PWA mobile-first dovrebbe coprire l'MVP; native solo se i dati di adozione lo giustificano.

## Non-goals

- **Booking di postazioni singole o sale riunioni** — l'app dichiara presenza con granularità di **piano/area**, non assegna scrivanie numerate (es. "Desk 12") né piantine interattive con mappa dei posti. Il piano (US-7) è un'indicazione informativa libera, non una prenotazione di risorsa.
- **Enforcement di policy ibride** — niente conteggi "hai fatto solo X giorni questo mese", niente alert verso manager. La policy aziendale vive altrove.
- **Tracking di orari di lavoro / timesheet** — Desko sa "in ufficio sì/no", non "dalle 9 alle 18". Niente clock-in/out.
- **Geofencing / verifica della presenza fisica reale** — la dichiarazione è basata su intenzione/auto-dichiarazione; nessuna verifica con badge, GPS, IP aziendale.
- **Gamification con punti, classifiche, badge** — esplicitamente escluso. La presenza non si premia.
- **SaaS multi-tenant** — single-tenant, deploy interno alla sola azienda.

## Technical constraints

- **Auth**: **better-auth** (OSS, framework-agnostic, sessions in db) con due provider:
  - **Microsoft Entra ID** (OIDC/OAuth2) — target produzione, MFA via Microsoft Authenticator gestita dalla policy aziendale.
  - **Email + password** (better-auth core) — per testing e fallback. Password hashate con scrypt (default better-auth). Email-verify e reset password via Resend.
  - **Plugin admin** di better-auth per gestione ruoli/permessi/ban/impersonate (US-8).
  - Sessions persistite in Postgres via Drizzle adapter.
- **Privacy / GDPR**:
  - Base giuridica: legittimo interesse + interesse del lavoratore (da confermare con DPO aziendale).
  - Minimizzazione: salviamo solo (utente, giorno, stato, timestamp di modifica). No log di consultazione persistenti se non strettamente necessari per security audit.
  - Retention: dati di presenza con TTL massimo (proposta MVP: 90 giorni in chiaro, poi anonimizzazione o cancellazione). Da confermare.
  - Diritto all'oblio (US-5) implementato come cancellazione hard.
- **Form factor**: PWA mobile-first responsive. Funziona pienamente su mobile (iOS/Android browser) e desktop (Chrome/Edge/Safari latest 2 versioni).
- **UI library**: Material UI (MUI) — scelta utente esplicita, non shadcn.
- **Ecosistema Microsoft**: integrazione Outlook valutata come Post-MVP, non come dipendenza.
- **Hosting**: TBD (probabili candidati: Azure App Service per allineamento ecosistema, oppure Vercel/Render se l'azienda accetta cloud non-Microsoft).
- **Database**: TBD nella fase di scelta stack (probabile: Postgres managed; payload dati molto piccolo).

## Open questions

Da chiarire prima della fase di scaffolding:

1. **Auth flow tecnico**: l'utente ha indicato Microsoft Authenticator e segnalato di voler approfondire. Da definire concretamente: OIDC code flow + PKCE, scopes richiesti (`openid profile email User.Read`?), claim per team/dipartimento, gestione del refresh token, single sign-out. — *Owner: utente*.
2. **Sorgente dei team/dipartimenti**: Entra ID espone i gruppi di appartenenza? Oppure HR fornisce un mapping separato? Senza questo, US-3 (filtri per team) non è implementabile in modo automatico al primo login.
3. **DPIA / approvazione DPO**: il prodotto tratta dati personali su abitudini lavorative; serve coinvolgimento del DPO aziendale prima del lancio per validare base giuridica e retention.
4. **Ruolo `hr_analytics`** (US-6): chi assegna questo ruolo? Quanti utenti lo avranno? Esiste già un gruppo Entra ID dedicato a HR?
5. **Hosting & cloud policy**: l'azienda ha vincoli su cloud provider (Azure-only, dati in EU, ecc.)?
6. **Soglia k-anonymity**: il valore <5 in US-6 è una proposta sensata ma da validare con il DPO. Se l'azienda ha team più piccoli di 5, va alzata la granularità minima (es. solo aggregato globale).
7. **"Last-minute" cutoff in US-1**: che orario consideriamo "last-minute"? (Proposta: dichiarazioni dopo le 8:00 del giorno stesso → flaggate visivamente come "last-minute".)
8. **Definizione di "team"**: l'azienda usa una struttura a team, dipartimenti, o entrambi? Influenza il modello dati e la UX dei filtri.
