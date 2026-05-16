/**
 * Desko typography tokens — fedeli al DESIGN.md §3.
 * Una sola famiglia (Inter). Display 800 / 0.95 lh, mai 900 / 0.85 (troppo aggressivo per B2B interno).
 * `calt` ovunque. Numeri tabulari sui calendari (gestito a livello componente).
 */

export const fontFamily = {
  display: '"Inter", system-ui, -apple-system, sans-serif',
  body: '"Inter", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
} as const;

export const fontFeatures = {
  default: '"calt", "ss01"',
  tabularNums: '"calt", "tnum"',
} as const;

export type TypographyVariant = {
  family: string;
  weight: number;
  size: number;
  lineHeight: number;
  letterSpacing: number;
  use: string;
  transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
};

export const typographyScale = {
  displayHero: {
    family: fontFamily.display,
    weight: 800,
    size: 56,
    lineHeight: 0.95,
    letterSpacing: -1.4,
    use: 'homepage hero, splash',
  },
  display: {
    family: fontFamily.display,
    weight: 800,
    size: 40,
    lineHeight: 1.0,
    letterSpacing: -0.8,
    use: 'section heading',
  },
  h1: {
    family: fontFamily.display,
    weight: 700,
    size: 32,
    lineHeight: 1.1,
    letterSpacing: -0.4,
    use: 'page title',
  },
  h2: {
    family: fontFamily.display,
    weight: 700,
    size: 24,
    lineHeight: 1.2,
    letterSpacing: -0.24,
    use: 'card section heading',
  },
  h3: {
    family: fontFamily.body,
    weight: 600,
    size: 20,
    lineHeight: 1.25,
    letterSpacing: -0.2,
    use: 'card title, dialog title',
  },
  h4: {
    family: fontFamily.body,
    weight: 600,
    size: 18,
    lineHeight: 1.3,
    letterSpacing: -0.1,
    use: 'list section, sub-card',
  },
  bodyLg: {
    family: fontFamily.body,
    weight: 400,
    size: 16,
    lineHeight: 1.5,
    letterSpacing: 0,
    use: 'lettura primaria',
  },
  body: {
    family: fontFamily.body,
    weight: 400,
    size: 14,
    lineHeight: 1.5,
    letterSpacing: 0,
    use: 'default body, table cells',
  },
  bodyStrong: {
    family: fontFamily.body,
    weight: 600,
    size: 14,
    lineHeight: 1.5,
    letterSpacing: 0,
    use: 'emphasis inline, badge label',
  },
  caption: {
    family: fontFamily.body,
    weight: 500,
    size: 12,
    lineHeight: 1.4,
    letterSpacing: 0.1,
    use: 'metadati, helper text',
  },
  overline: {
    family: fontFamily.body,
    weight: 600,
    size: 11,
    lineHeight: 1.4,
    letterSpacing: 0.8,
    transform: 'uppercase',
    use: 'label di sezione',
  },
  button: {
    family: fontFamily.body,
    weight: 600,
    size: 14,
    lineHeight: 1.0,
    letterSpacing: 0,
    transform: 'none',
    use: 'button label (no uppercase, override default MUI)',
  },
} as const satisfies Record<string, TypographyVariant>;

export const typography = {
  fontFamily,
  fontFeatures,
  scale: typographyScale,
} as const;

export type FontFamily = typeof fontFamily;
export type TypographyScale = typeof typographyScale;
export type Typography = typeof typography;
