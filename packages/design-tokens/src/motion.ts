/**
 * Desko motion tokens — DESIGN.md §6 (motion section).
 * Scale ammorbidite rispetto a Wise: 1.02 invece di 1.05 — sobrio, B2B-appropriate.
 * Rispettare `prefers-reduced-motion` lato componente: disabilitare scale, mantenere transizioni di colore.
 */

export const duration = {
  instant: 80,
  fast: 120,
  base: 200,
  slow: 320,
} as const;

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  enter: 'cubic-bezier(0, 0, 0, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

export const motionScale = {
  buttonHover: 1.02,
  buttonActive: 0.98,
  cardHover: 1.01,
} as const;

export const motion = {
  duration,
  easing,
  scale: motionScale,
} as const;

export type Duration = typeof duration;
export type Easing = typeof easing;
export type MotionScale = typeof motionScale;
export type Motion = typeof motion;

export const transition = (
  property: string = 'all',
  d: keyof Duration = 'base',
  e: keyof Easing = 'standard',
): string => `${property} ${duration[d]}ms ${easing[e]}`;
