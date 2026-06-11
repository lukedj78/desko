# Home page Desko con GSAP + three.js — Design

- **Data**: 2026-06-11
- **Stato**: approvato dall'utente (brainstorming compresso su sua richiesta)
- **Scope**: riscrittura della landing marketing `apps/web-shadcn/app/page.tsx`
- **Approccio scelto**: vanilla three.js + GSAP ScrollTrigger (scartati: react-three-fiber,
  troppo overhead per una singola scena; solo-GSAP, non rispetta la richiesta)

## Obiettivo

Sostituire la landing attuale (statica, 354 righe) con una versione animata che
racconti il prodotto: una scena 3D del palazzo Desko guidata dallo scroll, con le
animazioni DOM e di camera coordinate da un'unica timeline GSAP. Contenuti, testi,
CTA e SEO restano equivalenti a oggi; cambia la messa in scena.

## Contenuto della scena 3D

**Il palazzo Desko low-poly**: due piani stilizzati — 7° Piano (stanza con scrivanie)
e 2° Piano (co-working con bar) — in flat shading/wireframe color ink (`#0E0F0C`)
su canvas `#FAFAF7`, con pallini ocra (`#E8B931`) che si accendono sui piani a
rappresentare le presenze dichiarate. È la rappresentazione letterale del dominio
(US-7 floor switching), non decorazione generica.

Comportamento:

- **Idle (hero)**: rotazione lenta del palazzo + parallax leggero sul mouse.
- **Scroll** (timeline GSAP scrubbed):
  1. Hero → sezione "Pianifica": la camera zooma sul 7° piano, i pallini si accendono
     in sequenza.
  2. Sezione "Sposta": la camera scende al 2° piano e un pallino si sposta
     visibilmente dal 7° al 2° (il claim "cambi piano live").
  3. CTA finale: vista dall'alto, tutti i pallini accesi.
- Le sezioni testuali scorrono come oggi; GSAP anima anche reveal di titoli/card
  (fade/slide sobri, coerenti col tono Wise-like del DESIGN.md).

## Architettura

```
apps/web-shadcn/app/page.tsx          server component: testi, sezioni, SEO (invariato nel ruolo)
apps/web-shadcn/app/_components/home/
  hero-canvas.tsx                     'use client'; next/dynamic ssr:false; monta/smonta la scena
  office-scene.ts                     classe three.js PURA (zero React):
                                        init(canvas), resize(), dispose(),
                                        setProgress(t: 0..1)   ← posizione camera/stati lungo la narrazione
                                        setPointer(x, y)       ← parallax
  use-home-timeline.ts                hook GSAP: gsap.registerPlugin(ScrollTrigger),
                                        timeline unica scrubbed che pilota DOM + scene.setProgress
```

Confini: `office-scene.ts` non importa React né GSAP; `use-home-timeline.ts` è
l'unico ponte tra scroll e scena. I testi e le CTA restano HTML server-rendered
(indicizzabili, funzionanti senza JS).

Dipendenze nuove: `three` + `@types/three`, `gsap` — solo in
`apps/web-shadcn/package.json`.

## Robustezza, performance, accessibilità

- `prefers-reduced-motion: reduce` → nessuna timeline scroll, nessuna rotazione,
  nessun parallax: scena renderizzata una volta, fissa al frame hero; contenuti
  perfettamente fruibili.
- WebGL non disponibile / errore in init → fallback al blocco hero attuale (il
  canvas semplicemente non si monta; nessun crash).
- DPR cap a 2; render loop in pausa quando il canvas è fuori viewport
  (IntersectionObserver) e quando il tab è hidden.
- `dispose()` completo (geometrie, materiali, renderer, listener, ScrollTrigger
  kill) su unmount.
- three.js caricato solo sulla landing via dynamic import: zero impatto sul bundle
  dell'app autenticata.

## Error handling

- Init scena in try/catch: su errore, log in console e rimozione del canvas
  (resta l'HTML statico).
- Nessun dato remoto: la scena usa presenze fittizie costanti (è marketing, non
  dashboard). Nessuno stato di loading necessario.

## Test e verifica

- `pnpm type-check` pulito.
- Smoke Playwright manuale (MCP): la pagina renderizza, `<canvas>` presente,
  nessun errore console, CTA `/signup` e `/login` cliccabili, scroll fino al footer.
- Verifica `prefers-reduced-motion` via emulazione browser.
- Niente unit test sulla scena: il repo non ha infra jsdom/WebGL e non vale la pena
  introdurla per una pagina marketing.

## Fuori scope

- Modifiche all'app autenticata, al design system, a `@desko/ui`.
- Dati di presenza reali nella scena.
- Versione mobile nativa della scena (la landing è solo web).
