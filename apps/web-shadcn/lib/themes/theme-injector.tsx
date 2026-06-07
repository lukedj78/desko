import { FONT_TO_VAR } from './fonts';
import type { Theme, HslTriplet } from './types';

/**
 * <ThemeInjector> — Server Component che inietta gli override CSS per il
 * tema attivo. Sostituisce :root { --primary: ... } definito in globals.css
 * con i valori del theme corrente.
 *
 * Ordine cascade:
 *   1) globals.css :root { ... } — i token Desko ocra default
 *   2) <style> di questo componente — override del theme attivo
 *
 * Risultato: pre-paint, nessun JS, zero FOUC.
 *
 * ## Security (defense in depth)
 *
 * Il contenuto del <style> viene da MD files committati in repo (low risk
 * oggi), ma se in futuro permettiamo upload via admin UI diventerebbe
 * vettore XSS. Hardening preventivo:
 *
 *   1. Ogni HSL triplet validato contro regex `^\d{1,3}\s\d{1,3}%\s\d{1,3}%$`
 *   2. Radius validato come CSS unit puro (rem|px|em|%)
 *   3. Font key validato contro enum chiuso FONT_TO_VAR
 *   4. Qualunque token che non matcha = scartato silenziosamente
 *      (fallback ai default in globals.css)
 *   5. Niente quindi può escape `</style>` o injection arbitrario.
 */
export function ThemeInjector({ theme }: { theme: Theme }) {
  const css = buildThemeCss(theme);
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

// ─── Validators ──────────────────────────────────────────────────────────────

/** HSL triplet Tailwind v4: "H S% L%" — es. "42 80% 56%". */
const HSL_RE = /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/;
function safeHsl(value: unknown): HslTriplet | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return HSL_RE.test(trimmed) ? trimmed : null;
}

/** Radius CSS unit: numeric + (rem|px|em|%). Niente expression, niente var(). */
const RADIUS_RE = /^\d+(\.\d+)?(rem|px|em|%)$/;
function safeRadius(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return RADIUS_RE.test(trimmed) ? trimmed : null;
}

/** CSS variable name (es. "--font-inter"). Solo chiavi dell'enum FONT_TO_VAR. */
function safeFontVar(font: unknown): string {
  if (typeof font !== 'string') return '--font-inter';
  return FONT_TO_VAR[font as keyof typeof FONT_TO_VAR] ?? '--font-inter';
}

// ─── CSS builder ─────────────────────────────────────────────────────────────

function buildThemeCss(theme: Theme): string {
  const lightVars = serializeColorBlock(theme.colors.light);
  const darkVars = serializeColorBlock(theme.colors.dark);

  const sansVar = safeFontVar(theme.typography?.sans);
  const displayVar = safeFontVar(theme.typography?.display) || sansVar;
  const monoVar = safeFontVar(theme.typography?.mono);

  const radius = safeRadius(theme.radii?.base) ?? '0.5rem';

  return [
    `:root {`,
    lightVars,
    `  --radius: ${radius};`,
    `  --font-sans: var(${sansVar});`,
    `  --font-display: var(${displayVar});`,
    `  --font-mono: var(${monoVar});`,
    `  --font-inter: var(${sansVar}); /* legacy alias */`,
    `  --font-jetbrains: var(${monoVar}); /* legacy alias */`,
    `}`,
    `.dark {`,
    darkVars,
    `}`,
  ].join('\n');
}

function serializeColorBlock(colors: Record<string, unknown>): string {
  return Object.entries(colors)
    .map(([k, v]) => {
      const hsl = safeHsl(v);
      // Anche il nome chiave: solo lowercase + dash (no escape via key)
      const safeName = /^[a-z][a-z0-9-]*$/i.test(k) ? k : null;
      if (!hsl || !safeName) return null;
      return `  --${safeName}: ${hsl};`;
    })
    .filter((line): line is string => line !== null)
    .join('\n');
}
