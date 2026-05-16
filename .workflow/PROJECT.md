# Desko

## Overview

Desko è uno strumento interno che permette a ogni dipendente di dichiarare in quali giorni sarà in ufficio e di vedere a colpo d'occhio chi ci sarà. Nasce per risolvere un problema concreto della vita ibrida: arrivare in ufficio e scoprire che il team è in remoto, vanificando il viaggio. Non è un sistema di controllo né una gamification a punti — è uno strumento informativo, volontario, che rende la giornata in ufficio più produttiva e sociale perché sai chi ci sarà.

## Audience

Dipendenti di un'azienda in crescita (50–150 persone) con sede a Milano e team distribuito su tutta Italia. Il prodotto serve trasversalmente:

- **Profili tech** (engineering, product) — vogliono coordinare giornate in ufficio col proprio team o con chi lavora sullo stesso progetto.
- **Profili non-tech** (sales, ops, HR, marketing) — vogliono incrociare colleghi cross-funzionali e ridurre il rischio di "ufficio vuoto".
- **HR / People Ops** — interessati alla salute della cultura aziendale, ma senza usare Desko come strumento di policy enforcement.

Tutti operano sotto una **policy ibrida flessibile** (no quote rigide), in un'azienda che usa la suite Microsoft (Teams, Outlook, Entra ID).

## Problem & current alternatives

Oggi non esiste un punto unico dove sapere chi è in ufficio in un dato giorno. Le informazioni circolano in modo frammentato — messaggi su Teams, gruppi WhatsApp, conversazioni offline — il che significa che:

- Si decide di andare in ufficio "alla cieca", senza sapere se il proprio team o colleghi chiave saranno presenti.
- Quando il viaggio si rivela inutile (specialmente per chi vive fuori Milano), l'esperienza ibrida si erode: meno presenza significa meno motivi per gli altri di esserci, in un loop negativo.
- Le HR non hanno alcuna lettura aggregata, anche descrittiva e non-coercitiva, su come lo spazio fisico viene effettivamente usato.

Le alternative esistenti sono o pensate per il controllo (booking di scrivanie, badge gate) o per il calendario (Outlook, ma nessuno marca "in ufficio" come evento ricorrente). Manca il livello "lightweight social" — *chi c'è oggi/domani/questa settimana?*.

## Value proposition

**Desko risponde a una sola domanda — "chi sarà in ufficio quando ci sarò io?" — in due tap, e lo fa rispettando il fatto che la presenza è volontaria.** Il prodotto guadagna valore tanto più la rete di colleghi lo usa, ma ogni singolo utente ottiene utilità anche da subito (vedere il proprio team).

L'asse principale è **informativo/organizzativo**, non motivazionale: non spinge la presenza con punti o classifiche, la abilita rendendo le giornate in ufficio prevedibili e di alta qualità sociale.

## Success criteria (6 months)

- **Adoption attiva**: ≥70% dei dipendenti registra le proprie presenze almeno settimanalmente, in modo volontario (senza policy aziendale che lo imponga).
- **Lookup ratio**: ogni utente attivo apre Desko ≥3 volte a settimana per consultare le presenze altrui (segnale che il prodotto è effettivamente "consultato", non solo "compilato").
- **Qualitativo**: feedback aperti dei dipendenti che riportano almeno un episodio in cui Desko ha cambiato la decisione di venire in ufficio o ha facilitato un incontro che altrimenti non sarebbe avvenuto.

## Out of scope

- **Booking di scrivanie / sale riunioni** — Desko dichiara presenza, non assegna spazi.
- **Enforcement di policy ibride** — niente quote, niente alert "non hai raggiunto i giorni minimi".
- **Tracking di orari di lavoro** — non è un sistema di timesheet né di geofencing.
- **Gamification con punti/classifiche** — esplicitamente escluso per non snaturare il tono volontario.
- **Multi-tenant / SaaS** — è un prodotto interno single-tenant; nessun supporto a più aziende nello stesso deployment.

## Constraints

- **Auth**: SSO via Microsoft Entra ID (Authenticator) — niente account locali, l'identità è quella aziendale.
- **Privacy**: GDPR-first. I dati di presenza sono personali e sensibili (rivelano abitudini lavorative); minimizzazione, retention limitata, opt-out granulare per la visibilità.
- **Form factor**: mobile-first (la dichiarazione di presenza si fa al volo), ma fully usable da desktop.
- **Ecosistema**: integrazione con Outlook valutata come **fase 2** (non MVP) — l'MVP funziona standalone.
