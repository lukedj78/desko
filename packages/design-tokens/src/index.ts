/**
 * @desko/design-tokens
 *
 * Design system tokens condivisi per tutte le app Desko (web MUI, futura mobile RN).
 * Fonte di verità: .workflow/DESIGN.md (frontmatter YAML §tokens).
 *
 * Import canonico:
 *   import { tokens, colors, typography } from '@desko/design-tokens';
 *
 * Import granulare (tree-shaking-friendly):
 *   import { brand } from '@desko/design-tokens/colors';
 *   import { space } from '@desko/design-tokens/spacing';
 */

export * from './colors';
export * from './typography';
export * from './radii';
export * from './spacing';
export * from './shadows';
export * from './motion';
export * from './breakpoints';
export * from './z-index';

import { colors } from './colors';
import { typography } from './typography';
import { radii } from './radii';
import { spacing } from './spacing';
import { shadows } from './shadows';
import { motion } from './motion';
import { breakpoints } from './breakpoints';
import { zIndex } from './z-index';

export const tokens = {
  colors,
  typography,
  radii,
  spacing,
  shadows,
  motion,
  breakpoints,
  zIndex,
} as const;

export type Tokens = typeof tokens;

export const meta = {
  project: 'Desko',
  version: '0.1.0',
  source: '.workflow/DESIGN.md',
  inspiredBy: 'Wise (with Desko-specific tweaks: ochre instead of lime, lighter radii, weight 800 not 900)',
} as const;
