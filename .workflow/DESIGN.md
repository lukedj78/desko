---
project: Desko
version: 0.1
created: 2026-05-09
inspired_by: Wise (with tweaks for internal B2B tool)
ui_library: Material UI (MUI)
mode: light_first

font_pairing:
  display: Inter           # peso 800, sostituisce Wise Sans
  body: Inter              # peso 400/500/600
  mono: JetBrains Mono

colors:
  brand:
    primary: "#E8B931"           # Ocra Gold — accent CTA
    primary_text: "#2B1F00"      # Deep amber per testo su primary (contrast >12:1)
    primary_hover: "#F4C84A"     # ocra schiarita per hover
    primary_active: "#D4A625"    # ocra scurita per pressed
    primary_subtle: "#FBEFD0"    # background tenue per badge/banner
  surface:
    canvas: "#FAFAF7"            # off-white caldo, NON bianco puro
    paper: "#FFFFFF"             # surface card/dialog
    paper_alt: "#F4F2EC"         # surface secondario (sidebar, header)
    inverse: "#0E0F0C"           # surface scuro per sezioni inverted
  ink:
    primary: "#0E0F0C"           # testo principale
    secondary: "#454745"         # testo secondario
    muted: "#868685"             # testo tertiary / placeholder
    on_inverse: "#FAFAF7"        # testo su surface inverse
  semantic:
    success: "#2D7A3F"           # verde più caldo per non confondere col vecchio Wise lime
    success_subtle: "#E0F0D8"
    danger: "#C73E44"
    danger_subtle: "#FAE2E3"
    warning: "#E8B931"           # = primary (ocra) — convivenza voluta
    warning_subtle: "#FBEFD0"
    info: "#3D87C9"
    info_subtle: "#E0EDF7"
  border:
    subtle: "rgba(14, 15, 12, 0.08)"
    default: "rgba(14, 15, 12, 0.12)"
    strong: "rgba(14, 15, 12, 0.20)"
    focus: "#E8B931"             # focus ring ocra

typography:
  features: ["calt", "ss01"]     # contextual alternates su tutto
  scale:
    display_hero:
      family: Inter
      weight: 800
      size_px: 56
      line_height: 0.95
      letter_spacing_px: -1.4
      use: "homepage hero, splash"
    display:
      family: Inter
      weight: 800
      size_px: 40
      line_height: 1.00
      letter_spacing_px: -0.8
      use: "section heading"
    h1:
      family: Inter
      weight: 700
      size_px: 32
      line_height: 1.10
      letter_spacing_px: -0.4
      use: "page title"
    h2:
      family: Inter
      weight: 700
      size_px: 24
      line_height: 1.20
      letter_spacing_px: -0.24
      use: "card section heading"
    h3:
      family: Inter
      weight: 600
      size_px: 20
      line_height: 1.25
      letter_spacing_px: -0.20
      use: "card title, dialog title"
    h4:
      family: Inter
      weight: 600
      size_px: 18
      line_height: 1.30
      letter_spacing_px: -0.10
      use: "list section, sub-card"
    body_lg:
      family: Inter
      weight: 400
      size_px: 16
      line_height: 1.50
      letter_spacing_px: 0
      use: "lettura primaria"
    body:
      family: Inter
      weight: 400
      size_px: 14
      line_height: 1.50
      letter_spacing_px: 0
      use: "default body, table cells"
    body_strong:
      family: Inter
      weight: 600
      size_px: 14
      line_height: 1.50
      letter_spacing_px: 0
      use: "emphasis inline, badge label"
    caption:
      family: Inter
      weight: 500
      size_px: 12
      line_height: 1.40
      letter_spacing_px: 0.10
      use: "metadati, helper text"
    overline:
      family: Inter
      weight: 600
      size_px: 11
      line_height: 1.40
      letter_spacing_px: 0.80
      transform: uppercase
      use: "label di sezione"
    button:
      family: Inter
      weight: 600
      size_px: 14
      line_height: 1.00
      letter_spacing_px: 0
      transform: none           # no uppercase su button (override del default MUI)

radii:
  none: 0
  xs: 4                 # tag piccoli, helper inline
  sm: 8                 # button, input, select, chip rectangle
  md: 12                # card piccoli, list item
  lg: 16                # card medie
  xl: 20                # card grandi, dialog
  pill: 9999            # solo chip-pill, badge persona, avatar group counter

spacing:
  base_unit: 4
  scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96]

shadows:
  none: "none"
  ring: "0 0 0 1px rgba(14, 15, 12, 0.10)"
  sm: "0 1px 2px rgba(14, 15, 12, 0.06), 0 0 0 1px rgba(14, 15, 12, 0.04)"
  md: "0 4px 12px rgba(14, 15, 12, 0.08), 0 0 0 1px rgba(14, 15, 12, 0.04)"
  lg: "0 12px 24px rgba(14, 15, 12, 0.10), 0 0 0 1px rgba(14, 15, 12, 0.04)"
  focus_ring_primary: "0 0 0 3px rgba(232, 185, 49, 0.35)"

motion:
  duration:
    instant: 80
    fast: 120
    base: 200
    slow: 320
  easing:
    standard: "cubic-bezier(0.2, 0, 0, 1)"
    enter: "cubic-bezier(0, 0, 0, 1)"
    exit: "cubic-bezier(0.4, 0, 1, 1)"
  scale:
    button_hover: 1.02      # ammorbidito da Wise 1.05
    button_active: 0.98
    card_hover: 1.01

breakpoints:
  xs: 0
  sm: 600
  md: 900
  lg: 1200
  xl: 1536

z_index:
  base: 0
  dropdown: 100
  sticky: 200
  banner: 300
  overlay: 400
  modal: 500
  popover: 600
  toast: 700
  tooltip: 800
---

# Desko — Design System

## 1. Posizionamento estetico

Desko è uno strumento interno B2B che eredita la **chiarezza tipografica e l'ottimismo cromatico** del linguaggio Wise, ma li **ammorbidisce per il contesto enterprise**: la tipografia è confident senza essere "billboard", l'accent ocra è caldo e inviting senza scivolare nel consumer-fintech, le forme hanno un radius medio (8–20px) che bilancia friendly e professionale.

Il prodotto deve trasmettere tre cose:

1. **"È leggero, non burocratico"** — niente tabelloni HR, niente moduli da timbrare. La presenza è una dichiarazione informale.
2. **"È mio"** — la UI è personalizzata sull'utente (suo team, suoi follow), e l'identità visiva non deve sembrare una webapp HR generica.
3. **"Rispetta la mia privacy"** — le impostazioni di visibilità sono prominenti, mai nascoste in setting di terzo livello.

## 2. Palette — uso e gerarchia

### Brand
- **Ocra Gold (`#E8B931`)** è l'unico accent. Si usa per:
  - CTA primarie (button "Dichiara presenza", "Conferma settimana")
  - Indicatori "tu" o "in ufficio oggi" (es. avatar con bordo ocra)
  - Focus ring (su input, button, link tab-navigated)
  - Highlight su grafici (es. la barra del giorno corrente)
- **Non si usa** come background di superfici grandi (sidebar, header, card interi). L'ocra a tutto campo stanca visivamente e indebolisce il segnale CTA.

### Surface — il canvas è caldo
Il background di base è `#FAFAF7` (off-white caldo), non bianco puro. Questo ammorbidisce il contrasto col testo near-black e crea un'atmosfera "ufficio luminoso" coerente con il concept. Le card sono `#FFFFFF` per stagliarsi leggermente sul canvas.

### Semantic — nota su success
Il verde success (`#2D7A3F`) è un verde foresta, non lime. Scelta deliberata: con un primary giallo, un verde lime stonerebbe; un verde più scuro e caldo dialoga meglio.

### Warning = Primary (intenzionale)
`warning` e `primary` coincidono nel valore (`#E8B931`). In un tool informativo non-coercitivo, "warning" è raramente usato (no errori critici, no blocchi); quando appare, comunica un'attenzione lieve dello stesso registro emozionale del CTA. Se in futuro servisse separarli, si spinge `warning` verso un arancione (`#E58A1A`).

## 3. Tipografia

### Una sola famiglia: Inter
Wise usa Wise Sans + Inter. Per Desko, **una sola famiglia (Inter)** semplifica deploy, performance e coerenza. I pesi 800 / 700 / 600 / 500 / 400 sono sufficienti per tutta la gerarchia.

### Pesi e ratio
- **Display (800)** per hero, sostituisce Wise Sans Black 900. Pesa abbastanza da avere personalità ma non sembra "protesta".
- **H1–H2 (700)** per titoli di pagina e sezione.
- **H3–H4 (600)** per titoli di card e dialog.
- **Body (400)** per lettura, **600** per emphasis e button.
- **Caption (500)** per metadati, **600 + uppercase + tracking 0.8** per overline.

### Line-height e tracking
- Display ha line-height **0.95–1.00** (più tight del default 1.5, ma non i 0.85 di Wise — quel livello di density è troppo aggressivo per un tool interno).
- Headings hanno tracking negativo lieve (`-0.2` a `-1.4px`) per compattare visivamente le parole.
- Body resta a tracking 0, line-height 1.5 — leggibilità prima di stile.

### OpenType `calt` ovunque
Mantenuto da Wise. Su Inter le contextual alternates sono sottili ma migliorano la qualità visiva (in particolare i numeri tabulari nei calendari, vedi sotto).

### Numeri tabulari
Per il calendario presenze attivare `font-variant-numeric: tabular-nums` su tutte le celle che mostrano giorni/numeri — evita il "saltellamento" delle cifre tra colonne.

## 4. Forme e radius

### Scala radius rivista
| Token | Valore | Uso |
|---|---|---|
| `xs` | 4px | tag inline, helper container |
| `sm` | 8px | **button, input, select** (ammorbidito da pill 9999) |
| `md` | 12px | list item, card piccola |
| `lg` | 16px | **card standard** |
| `xl` | 20px | dialog, card hero |
| `pill` | 9999px | **solo chip-pill, badge persona, avatar group counter** |

### Razionale
La scelta di **8px sui button** (vs Wise 9999) è la differenza estetica più importante rispetto al riferimento. Un radius medio fa sembrare il prodotto:
- più "tool produttività" e meno "fintech app"
- più seria senza essere fredda
- più allineata alle convenzioni MUI default (che è 4–8px), riducendo override invasivi

I pill restano per **chip persona** (foto + nome, classico delle vista "chi è in ufficio") e badge piccoli — lì il pill è linguaggio universale.

## 5. Componenti chiave (mapping a MUI)

### Button
**Variante `contained` (primary CTA)**
- background: `colors.brand.primary` (`#E8B931`)
- color: `colors.brand.primary_text` (`#2B1F00`)
- borderRadius: `radii.sm` (8px)
- padding: `8px 16px` (size medium), `12px 24px` (size large)
- typography: `button` (14px / 600 / no uppercase)
- hover: background `primary_hover` (`#F4C84A`) + `transform: scale(1.02)` + `transition: all 200ms`
- active: `primary_active` (`#D4A625`) + `scale(0.98)`
- focus-visible: outline `2px solid #E8B931` con offset `2px` + `box-shadow: focus_ring_primary`
- disabled: opacity 0.4, no scale, no hover

**Variante `outlined` (secondary)**
- border: `1px solid border.default`
- color: `ink.primary`
- background: transparent → hover `paper_alt`
- stesso radius e size della contained

**Variante `text` (tertiary)**
- color: `ink.primary`
- background: transparent → hover `rgba(14, 15, 12, 0.04)`
- niente border

**Override MUI globale**: `textTransform: 'none'` su tutti i Button (default MUI mette UPPERCASE — non voluto).

### TextField / Input
- borderRadius: `radii.sm` (8px)
- variant default: `outlined` con border `border.default`
- focus: border `2px solid colors.brand.primary` + `box-shadow: focus_ring_primary`
- error: border `colors.semantic.danger` + helper text in rosso
- placeholder: `ink.muted`
- label: caption weight 500, mai full uppercase

### Card
- background: `surface.paper` (`#FFFFFF`)
- borderRadius: `radii.lg` (16px) per card standard, `radii.xl` (20px) per card hero
- shadow: `shadows.sm` di default, `shadows.md` per card "feature"
- padding interno: 16px (compact), 24px (standard), 32px (hero)
- niente border quando c'è shadow; border `border.subtle` solo se shadow è `none`

### Chip persona (componente custom Desko)
Il "chip persona" è il blocco più ripetuto della UI (mostra colleghi presenti). Specifiche:
- container: pill (`radii.pill`), padding `4px 12px 4px 4px`
- avatar: 24px circle (foto da Entra ID o iniziali su `paper_alt`)
- nome: `body_strong` (14px / 600), troncato a 1 riga con ellipsis
- background: `paper_alt` di default
- hover: `border` ocra (`1px solid #E8B931`) → segnala "cliccabile, vedi profilo"
- variante "tu" (l'utente loggato): background `primary_subtle` (`#FBEFD0`) + bordo ocra permanente

### Avatar group (vista "chi è oggi")
- Sovrapposizione classica: avatar circolari 32px, overlap di 8px
- Counter "+N" con pill (`radii.pill`), background `paper_alt`, color `ink.secondary`
- Click sul counter apre lista completa

### Calendar / Week view
Componente custom (MUI non lo copre nativamente). Specifiche:
- griglia 7 colonne settimana corrente, righe per persone seguite
- header colonna: giorno + data (`overline` per giorno, `body_strong` per data, tabular-nums)
- giorno corrente: background colonna `primary_subtle`, evidenza ocra sul header
- celle "in ufficio": background `success_subtle`, bordo lieve `success`
- celle "remoto" / "non specificato": background `paper`, no bordo

### Dialog / Modal
- borderRadius: `radii.xl` (20px)
- shadow: `lg`
- backdrop: `rgba(14, 15, 12, 0.32)` con `backdrop-filter: blur(4px)`
- header: `h3` (20px / 600)
- close button: icon button 32px, `text` variant

### Toast / Snackbar
- borderRadius: `radii.md` (12px)
- background: `inverse` (`#0E0F0C`) per notifiche neutrali, `success` / `danger` per esito azione
- color: `on_inverse`
- shadow: `lg`
- durata default: 4000ms

## 6. Tema MUI — struttura del file

Il file `theme.ts` deve essere generato da questo DESIGN.md con questa struttura indicativa:

```ts
import { createTheme } from '@mui/material/styles';

export const deskoTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#E8B931', contrastText: '#2B1F00' },
    secondary: { main: '#0E0F0C' },
    success: { main: '#2D7A3F' },
    error: { main: '#C73E44' },
    warning: { main: '#E8B931' },
    info: { main: '#3D87C9' },
    background: { default: '#FAFAF7', paper: '#FFFFFF' },
    text: { primary: '#0E0F0C', secondary: '#454745', disabled: '#868685' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontFeatureSettings: '"calt"',
    button: { textTransform: 'none', fontWeight: 600 },
    // ... resto della scala
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
          '&:hover': { transform: 'scale(1.02)' },
          '&:active': { transform: 'scale(0.98)' },
        },
      },
    },
    // ... altri override
  },
});
```

## 7. Dark mode (Post-MVP)

Non incluso nell'MVP, ma il design system è pre-pensato per estendersi:
- canvas → `#0E0F0C`, paper → `#1A1B17`, paper_alt → `#252620`
- ink primary → `#FAFAF7`, secondary → `#A8AAA5`
- ocra primary resta `#E8B931` (contrasto su scuro: ~10:1 → AAA)
- focus_ring_primary stessa formula con 0.35 alpha

## 8. Accessibilità

- **Contrasto**: tutti gli accoppiamenti testo/sfondo verificati ≥4.5:1 (AA Normal). Il primo ocra `#E8B931` su bianco non passa AA per testo Normal (~2.8:1) — per questo non si usa MAI ocra come colore di testo su bianco; solo come background con testo scuro.
- **Focus visible**: ring ocra a 3px sempre presente su tab navigation. Mai `outline: none` senza sostituto.
- **Touch target**: minimo 44x44px su elementi interattivi mobile (button height 40px ma area cliccabile estesa con padding).
- **Riduce motion**: rispetta `prefers-reduced-motion: reduce` → disabilita scale animations, mantiene solo transizioni di colore.
- **Screen reader**: tutte le icone-only button hanno `aria-label`; il calendar component usa `role="grid"` con header semantici.

## 9. Do / Don't

### Do
- ✅ Usa l'ocra **solo** per CTA, focus, e indicatori "tu/oggi" — protegge il segnale.
- ✅ Mantieni il canvas warm (`#FAFAF7`), non bianco puro.
- ✅ Numeri tabulari su calendari e tabelle.
- ✅ Scale 1.02/0.98 su button, transizioni 200ms.
- ✅ Radius 8px su button, 16px su card, pill solo per chip persona.

### Don't
- ❌ Niente Wise Sans 900 + line-height 0.85 — troppo aggressivo per un tool interno.
- ❌ Niente background ocra a tutto schermo (sidebar gialle, hero gialli) — affatica e svaluta il CTA.
- ❌ Niente button rotondi a pill (9999) — il radius 8px è il marker visivo di Desko.
- ❌ Niente button UPPERCASE (default MUI da disabilitare globalmente).
- ❌ Niente shadow generose stile Material classico — preferiamo shadow piatte + ring sottile.

## 10. Asset e font

- **Inter** caricato via `@fontconfig/inter` o Google Fonts self-hosted, pesi 400/500/600/700/800.
- Logo Desko: TBD — proposta di lavorare su una wordmark Inter 800 con il puntino di "i" in ocra.
- Iconografia: Material Symbols Rounded (peso 400, fill 0) per coerenza con MUI nativo.
