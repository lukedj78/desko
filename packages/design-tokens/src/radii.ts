/**
 * Desko radius tokens — DESIGN.md §4.
 * Differenza chiave rispetto al riferimento Wise: button a 8px (no pill 9999),
 * pill riservato SOLO a chip persona / badge / avatar group counter.
 *
 * Valori in pixel come numeri puri — i consumer (MUI / RN) li convertono se serve.
 */

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
} as const;

export type Radii = typeof radii;
export type RadiusToken = keyof Radii;
