/**
 * Desko breakpoint tokens — DESIGN.md §8.
 * Allineati ai default MUI per evitare override invasivi.
 */

export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

export type Breakpoints = typeof breakpoints;
export type BreakpointToken = keyof Breakpoints;

export const mediaUp = (bp: BreakpointToken): string =>
  `@media (min-width: ${breakpoints[bp]}px)`;

export const mediaDown = (bp: BreakpointToken): string =>
  `@media (max-width: ${breakpoints[bp] - 0.05}px)`;
