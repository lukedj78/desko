/**
 * Theme — design system applicabile a runtime via cookie + CSS var injection.
 *
 * Fonte: file Markdown in `.workflow/themes/*.md` con YAML frontmatter.
 * Parsato server-side (vedi `registry.server.ts`) e iniettato in <head>
 * dal `<ThemeInjector>` nel root layout.
 */

export type FontKey =
  | 'Inter'
  | 'Manrope'
  | 'Geist'
  | 'Space Grotesk'
  | 'IBM Plex Sans'
  | 'Fraunces'
  | 'Crimson Text'
  | 'JetBrains Mono'
  | 'Geist Mono';

export type ColorTokenName =
  | 'background'
  | 'foreground'
  | 'card'
  | 'card-foreground'
  | 'popover'
  | 'popover-foreground'
  | 'primary'
  | 'primary-foreground'
  | 'secondary'
  | 'secondary-foreground'
  | 'muted'
  | 'muted-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'destructive'
  | 'destructive-foreground'
  | 'success'
  | 'success-foreground'
  | 'warning'
  | 'warning-foreground'
  | 'info'
  | 'info-foreground'
  | 'border'
  | 'input'
  | 'ring';

/** Valore HSL nel formato Tailwind v4 — es. "42 80% 56%" (no `hsl()` wrapper) */
export type HslTriplet = string;

export type ColorPalette = Record<ColorTokenName, HslTriplet>;

export type ThemeTypography = {
  /** Famiglia primary per testo body */
  sans: FontKey;
  /** Famiglia per heading / display (fallback su sans) */
  display: FontKey;
  /** Famiglia mono per code/metadata */
  mono: FontKey;
};

export type ThemeRadii = {
  /** Base radius (--radius); --radius-md/lg/xl derivati */
  base: string;
};

/**
 * Effetto liquid glass iOS-style — multi-layer composition.
 * Si applica via CSS overrides scoped a [data-theme-effects~="glass"] su
 * `<html>`. Opt-in puro: temi senza `effects.glass` non emettono nulla.
 *
 * Strato per strato (vedi `buildGlassCss` in theme-injector.tsx):
 *   1. Glass plate (::before)  → backdrop-filter blur+saturate+brightness
 *                                 con gradient di rifrazione + SVG noise
 *   2. Edge sheen (::after)    → linear-gradient + mask-composite:exclude
 *   3. Inner highlights        → inset box-shadow (top edge + ring)
 *   4. Outer drop shadow       → box-shadow (depth)
 *   5. Body background pattern → radial gradients per dare "materiale"
 *                                 al blur (senza pattern dietro il blur
 *                                 non si vede)
 */
export type GlassEffect = {
  /** Backdrop blur in px — es. "24px" (iOS 26 ~ 20-32px) */
  blur: string;
  /** Opacità surface glass — 0..1 (es. 0.45 per iOS-like translucency) */
  surfaceAlpha: number;
  /** Saturazione backdrop — es. "180%" (iOS classic) */
  saturate?: string;
  /** Brightness boost backdrop — es. "1.1" per il "glow" del vetro */
  brightness?: string;
  /** Alpha del bordo bianco luminoso — 0..1 (es. 0.18) */
  borderAlpha?: number;
  /** Intensità dello sheen diagonale sul bordo — 0..1 (es. 0.6) */
  sheenAlpha?: number;
  /**
   * SVG noise displacement intensity per simulare la rifrazione del vetro.
   * 0 = disattivato, 1..100 = scala displacement (es. 60). Usa `filter:
   * url(#desko-glass-noise)` sul `::before`. Non cross-browser su backdrop,
   * ma sul foreground elemento sì.
   */
  noiseScale?: number;
};

export type ThemeEffects = {
  glass?: GlassEffect;
};

export type Theme = {
  id: string;
  name: string;
  description: string;
  /** Hex color principale, usato per swatch preview */
  swatch: string;
  typography: ThemeTypography;
  radii: ThemeRadii;
  colors: {
    light: ColorPalette;
    dark: ColorPalette;
  };
  /** Effetti CSS opzionali (liquid glass, future: neumorphic, etc.) */
  effects?: ThemeEffects;
  /** Body markdown del DESIGN.md (rationale, do/don'ts) — opzionale */
  body?: string;
};
