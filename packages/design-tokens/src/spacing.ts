/**
 * Desko spacing tokens — DESIGN.md §5.
 * Base unit 4px. Scala discreta (no 1px / 2px / 3px ad hoc come in Wise — semplifichiamo).
 *
 * Helper `space(n)` ritorna stringa CSS: space(2) === '8px'.
 * Helper `spaceUnit(n)` ritorna numero di unità per MUI theme.spacing.
 */

export const baseUnit = 4 as const;

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export type Spacing = typeof spacing;
export type SpacingToken = keyof Spacing;

export const space = (n: SpacingToken): string => `${spacing[n]}px`;

export const spaceUnit = (n: SpacingToken): number => spacing[n] / baseUnit;
