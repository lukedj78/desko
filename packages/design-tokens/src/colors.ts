/**
 * Desko color tokens — fedeli al DESIGN.md §2.
 * Ocra Gold come unico accent. Canvas warm (#FAFAF7), non bianco puro.
 * Mai usare ocra come testo su bianco — solo come background con testo scuro.
 */

export const brand = {
  primary: '#E8B931',
  primaryText: '#2B1F00',
  primaryHover: '#F4C84A',
  primaryActive: '#D4A625',
  primarySubtle: '#FBEFD0',
} as const;

export const surface = {
  canvas: '#FAFAF7',
  paper: '#FFFFFF',
  paperAlt: '#F4F2EC',
  inverse: '#0E0F0C',
} as const;

export const ink = {
  primary: '#0E0F0C',
  secondary: '#454745',
  muted: '#868685',
  onInverse: '#FAFAF7',
} as const;

export const semantic = {
  success: '#2D7A3F',
  successSubtle: '#E0F0D8',
  danger: '#C73E44',
  dangerSubtle: '#FAE2E3',
  warning: '#E8B931',
  warningSubtle: '#FBEFD0',
  info: '#3D87C9',
  infoSubtle: '#E0EDF7',
} as const;

export const border = {
  subtle: 'rgba(14, 15, 12, 0.08)',
  default: 'rgba(14, 15, 12, 0.12)',
  strong: 'rgba(14, 15, 12, 0.20)',
  focus: '#E8B931',
} as const;

export const colors = {
  brand,
  surface,
  ink,
  semantic,
  border,
} as const;

export type Brand = typeof brand;
export type Surface = typeof surface;
export type Ink = typeof ink;
export type Semantic = typeof semantic;
export type Border = typeof border;
export type Colors = typeof colors;
