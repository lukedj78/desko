/**
 * Desko z-index tokens — DESIGN.md frontmatter.
 * Layer espliciti per evitare arms-race fra componenti (sidebar vs modal vs toast).
 */

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  banner: 300,
  overlay: 400,
  modal: 500,
  popover: 600,
  toast: 700,
  tooltip: 800,
} as const;

export type ZIndex = typeof zIndex;
export type ZIndexToken = keyof ZIndex;
