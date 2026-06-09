---
id: enterprice-liquid-glass
name: Enterprice Liquid Glass
description: Enterprise dark-first ispirato a Enterprice — blu/viola signature — con liquid glass iOS-style su card e popover (backdrop-blur + translucenza).
swatch: "#0000EE"
typography:
  sans: IBM Plex Sans
  display: Space Grotesk
  mono: JetBrains Mono
radii:
  base: 0.875rem
effects:
  glass:
    # iOS 26 Liquid Glass — multi-layer composition.
    # Vedi `buildGlassCss` in theme-injector.tsx per i 5 layer applicati.
    blur: "28px"           # backdrop blur deciso (iOS 26 ~ 20-32px)
    surfaceAlpha: 0.42     # tint translucido — basso = più "vetro", alto = più "frosted"
    saturate: "180%"       # saturazione classica iOS
    brightness: "1.08"     # boost luminosità per il "glow"
    borderAlpha: 0.22      # bordo bianco lucido
    sheenAlpha: 0.65       # sheen diagonale sul bordo (intensità lucida)
    noiseScale: 40         # rifrazione SVG noise — 0 = off, 30-60 = sweet spot
colors:
  light:
    background: "0 0% 100%"
    foreground: "0 0% 9%"
    card: "0 0% 100%"
    card-foreground: "0 0% 9%"
    popover: "0 0% 100%"
    popover-foreground: "0 0% 9%"
    primary: "240 100% 47%"
    primary-foreground: "0 0% 100%"
    secondary: "0 0% 95%"
    secondary-foreground: "0 0% 9%"
    muted: "0 0% 97%"
    muted-foreground: "0 0% 36%"
    accent: "285 100% 25%"
    accent-foreground: "0 0% 100%"
    destructive: "0 75% 50%"
    destructive-foreground: "0 0% 100%"
    success: "160 65% 38%"
    success-foreground: "0 0% 100%"
    warning: "38 90% 50%"
    warning-foreground: "0 0% 10%"
    info: "210 90% 50%"
    info-foreground: "0 0% 100%"
    border: "0 0% 88%"
    input: "0 0% 88%"
    ring: "240 100% 47%"
  dark:
    background: "235 30% 6%"
    foreground: "0 0% 96%"
    card: "235 28% 14%"
    card-foreground: "0 0% 96%"
    popover: "235 28% 14%"
    popover-foreground: "0 0% 96%"
    primary: "240 100% 60%"
    primary-foreground: "0 0% 100%"
    secondary: "235 20% 22%"
    secondary-foreground: "0 0% 96%"
    muted: "235 20% 18%"
    muted-foreground: "235 10% 65%"
    accent: "285 60% 45%"
    accent-foreground: "0 0% 100%"
    destructive: "0 75% 55%"
    destructive-foreground: "0 0% 100%"
    success: "160 65% 45%"
    success-foreground: "0 0% 100%"
    warning: "38 90% 55%"
    warning-foreground: "0 0% 10%"
    info: "210 90% 60%"
    info-foreground: "0 0% 100%"
    border: "235 25% 28%"
    input: "235 25% 28%"
    ring: "240 100% 60%"
---

# Enterprice Liquid Glass

Variante enterprise dark-first ispirata al design system **Enterprice** — palette autoritaria (blu signature `#0000EE`, viola accento `#4E0068`, neutrali profondi) — sovrapposta a una resa **liquid glass iOS-style**: superfici translucide con backdrop-blur 20px + saturate 180%, raggi morbidi 0.875rem (14px) per richiamare le card iOS 26.

## Identità

- **Dark-first**: background `#0F1018` (deep navy-black), card translucide sopra
- **Primary blu vivido** (`#0000EE` light / `#1A1AFF` dark) per CTA, link e focus ring
- **Accent viola** (`#4E0068`) per emphasis secondario e UI highlights
- **Typography commanding**: Space Grotesk per display (geometrico, prende il posto di Gotham per le headline), IBM Plex Sans per body (peso medio enterprise), JetBrains Mono per metadata
- **Raggi morbidi** (0.875rem) come compromesso tra l'aesthetic sharp di Enterprice (`0px`) e il rounded iOS liquid glass
- **Liquid glass**: card e popover automaticamente translucidi grazie al campo `effects.glass` del theme — niente refactor sui componenti

## Quando usarlo

- Aziende finanziarie / energy / consulenza enterprise che vogliono un'aria autoritaria
- Prodotti dove "trust + technological precision" è il messaggio principale
- Demo / pitch dove serve un look memorabile (il glass blur è immediatamente riconoscibile)
- Settori che apprezzano l'estetica iOS moderna ma in chiave business

## Note implementative

Il liquid glass è applicato via CSS overrides scoped a `[data-theme-effects~="glass"]` su `<html>` — quando il theme è attivo, tutte le `.bg-card` e `.bg-popover` del codebase ricevono `background-color: hsl(var(--card) / 0.62)` + `backdrop-filter: blur(20px) saturate(180%)`. Zero opt-in per componente, zero refactor.

I componenti che hanno colori inline (es. banner CTA, sidebar active item) usano `hsl(var(--primary) / X)` quindi rispettano automaticamente la palette blu Enterprice — il blur si applica solo alle superfici card-style, dove rende meglio.
