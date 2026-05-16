/**
 * Desko shadow tokens — DESIGN.md §6.
 * Filosofia: shadow piatte + ring sottile, niente Material drop-shadow generosi.
 * `focus_ring_primary` è la base del focus state ocra, riusato su button/input/link.
 */

export const shadows = {
  none: 'none',
  ring: '0 0 0 1px rgba(14, 15, 12, 0.10)',
  sm: '0 1px 2px rgba(14, 15, 12, 0.06), 0 0 0 1px rgba(14, 15, 12, 0.04)',
  md: '0 4px 12px rgba(14, 15, 12, 0.08), 0 0 0 1px rgba(14, 15, 12, 0.04)',
  lg: '0 12px 24px rgba(14, 15, 12, 0.10), 0 0 0 1px rgba(14, 15, 12, 0.04)',
  focusRingPrimary: '0 0 0 3px rgba(232, 185, 49, 0.35)',
} as const;

export type Shadows = typeof shadows;
export type ShadowToken = keyof Shadows;
