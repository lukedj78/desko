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
  /** Body markdown del DESIGN.md (rationale, do/don'ts) — opzionale */
  body?: string;
};
