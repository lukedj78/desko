import { FONT_TO_VAR } from './fonts';
import type { Theme, HslTriplet, GlassEffect } from './types';

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

/**
 * Ritorna l'effetto glass validato del theme attivo, o null se il theme
 * non ha effects.glass o se la validazione fallisce.
 * Usato dal layout per decidere se montare <GlassNoiseFilter>.
 */
export function getActiveGlassEffect(theme: Theme | null | undefined): GlassEffect | null {
  if (!theme) return null;
  return safeGlassEffect(theme.effects?.glass);
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

/** Blur CSS unit — solo `Npx` (no expression, no calc). */
const BLUR_RE = /^\d{1,2}(\.\d+)?px$/;
function safeBlur(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return BLUR_RE.test(value.trim()) ? value.trim() : null;
}

/** Saturate filter — es. "180%" o "1.8". Default null = no saturate. */
const SATURATE_RE = /^\d{1,3}(\.\d+)?%?$/;
function safeSaturate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return SATURATE_RE.test(value.trim()) ? value.trim() : null;
}

/** Alpha 0..1 — finito, inclusive. */
function safeAlpha(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 1) return null;
  // Massimo 3 decimali per evitare valori bizzarri (es. 0.123456789)
  return Math.round(n * 1000) / 1000;
}

/** Brightness/contrast filter unit — "1.1" o "110%". */
const BRIGHTNESS_RE = /^\d{1,2}(\.\d+)?%?$/;
function safeBrightness(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return BRIGHTNESS_RE.test(value.trim()) ? value.trim() : null;
}

/** Intero positivo entro un range (es. noise scale 0..100). */
function safeIntInRange(value: unknown, min: number, max: number): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  if (r < min || r > max) return null;
  return r;
}

/**
 * Restituisce un GlassEffect validato e safe-da-iniettare, oppure null se
 * uno dei campi obbligatori non passa la validazione (silent drop).
 */
function safeGlassEffect(effect: GlassEffect | undefined): GlassEffect | null {
  if (!effect) return null;
  const blur = safeBlur(effect.blur);
  const surfaceAlpha = safeAlpha(effect.surfaceAlpha);
  if (!blur || surfaceAlpha === null) return null;
  const saturate = safeSaturate(effect.saturate) ?? undefined;
  const brightness = safeBrightness(effect.brightness) ?? undefined;
  const borderAlpha = safeAlpha(effect.borderAlpha) ?? undefined;
  const sheenAlpha = safeAlpha(effect.sheenAlpha) ?? undefined;
  const noiseScale = safeIntInRange(effect.noiseScale, 0, 100) ?? undefined;
  return { blur, surfaceAlpha, saturate, brightness, borderAlpha, sheenAlpha, noiseScale };
}

// ─── CSS builder ─────────────────────────────────────────────────────────────

function buildThemeCss(theme: Theme): string {
  const lightVars = serializeColorBlock(theme.colors.light);
  const darkVars = serializeColorBlock(theme.colors.dark);

  const sansVar = safeFontVar(theme.typography?.sans);
  const displayVar = safeFontVar(theme.typography?.display) || sansVar;
  const monoVar = safeFontVar(theme.typography?.mono);

  const radius = safeRadius(theme.radii?.base) ?? '0.5rem';

  const lines = [
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
  ];

  const glass = safeGlassEffect(theme.effects?.glass);
  if (glass) {
    lines.push(buildGlassCss(glass));
  }

  return lines.join('\n');
}

/**
 * CSS liquid glass iOS 26-style — scoped a `[data-theme-effects~="glass"]`
 * su `<html>` (vedi layout.tsx). Multi-layer composition:
 *
 *   1. Card root: bg trasparente, border bianco translucido, isolation,
 *      box-shadow stack per outer drop + inner highlights ("vetro lucido")
 *   2. ::before  → "glass plate": backdrop-filter + gradient di rifrazione
 *                  + opzionale SVG noise displacement (filter: url(...))
 *   3. ::after   → "edge sheen": linear-gradient diagonale scolpita SOLO
 *                  sul bordo via mask-composite:exclude
 *   4. body::before → background pattern (radial gradients) per dare
 *                  "materiale" al blur — senza pattern dietro, il blur
 *                  non si vede.
 *
 * !important sul background batte le utility Tailwind `bg-card` /
 * `bg-popover` senza richiedere opt-in per componente.
 */
function buildGlassCss(glass: GlassEffect): string {
  const sat = glass.saturate ?? '180%';
  const bri = glass.brightness ?? '1.05';
  const backdropFilter = `blur(${glass.blur}) saturate(${sat}) brightness(${bri})`;
  const borderA = glass.borderAlpha ?? 0.18;
  const sheenA = glass.sheenAlpha ?? 0.55;
  const noiseFilter =
    glass.noiseScale && glass.noiseScale > 0 ? `filter: url(#desko-glass-noise);` : '';

  return [
    // 1) Card root — trasparente + border bianco translucido + shadow stack.
    // NB: niente `overflow: hidden` qui — il ::before glass-plate ha
    // border-radius:inherit quindi è già rounded, e l'overflow:hidden
    // clipperebbe tooltip/popover/dropdown che sporgono dalla card.
    `[data-theme-effects~="glass"] .bg-card,`,
    `[data-theme-effects~="glass"] [data-slot="card"],`,
    `[data-theme-effects~="glass"] .bg-popover {`,
    `  background-color: transparent !important;`,
    `  border-color: hsl(0 0% 100% / ${borderA}) !important;`,
    `  position: relative;`,
    `  isolation: isolate;`,
    `  box-shadow:`,
    `    0 8px 32px hsl(235 30% 0% / 0.45),`,
    `    0 1px 0 hsl(0 0% 100% / 0.06),`,
    `    inset 0 1px 0 hsl(0 0% 100% / 0.22),`,
    `    inset 0 0 0 0.5px hsl(0 0% 100% / ${borderA}) !important;`,
    `}`,
    // 2) ::before — glass plate (backdrop blur + refraction gradient + noise)
    `[data-theme-effects~="glass"] .bg-card::before,`,
    `[data-theme-effects~="glass"] [data-slot="card"]::before,`,
    `[data-theme-effects~="glass"] .bg-popover::before {`,
    `  content: "";`,
    `  position: absolute;`,
    `  inset: 0;`,
    `  z-index: -1;`,
    `  border-radius: inherit;`,
    `  background:`,
    `    linear-gradient(135deg,`,
    `      hsl(var(--card) / ${glass.surfaceAlpha * 0.7}) 0%,`,
    `      hsl(var(--card) / ${glass.surfaceAlpha}) 50%,`,
    `      hsl(var(--card) / ${glass.surfaceAlpha * 0.7}) 100%);`,
    `  backdrop-filter: ${backdropFilter};`,
    `  -webkit-backdrop-filter: ${backdropFilter};`,
    `  ${noiseFilter}`,
    `  pointer-events: none;`,
    `}`,
    // 3) ::after — edge sheen (only border, via mask composite)
    `[data-theme-effects~="glass"] .bg-card::after,`,
    `[data-theme-effects~="glass"] [data-slot="card"]::after,`,
    `[data-theme-effects~="glass"] .bg-popover::after {`,
    `  content: "";`,
    `  position: absolute;`,
    `  inset: 0;`,
    `  border-radius: inherit;`,
    `  padding: 1px;`,
    `  background: linear-gradient(135deg,`,
    `    hsl(0 0% 100% / ${sheenA}) 0%,`,
    `    hsl(0 0% 100% / 0) 28%,`,
    `    hsl(0 0% 100% / 0) 72%,`,
    `    hsl(0 0% 100% / ${sheenA * 0.7}) 100%);`,
    `  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);`,
    `  -webkit-mask-composite: xor;`,
    `          mask-composite: exclude;`,
    `  pointer-events: none;`,
    `}`,
    // 4) Background pattern dietro al blur — radial gradient blu+viola che
    //    simulano lighting iOS. Solo dark mode.
    //
    //    Implementato come <html>::before fisso al viewport invece di
    //    `body { background-attachment: fixed }`: quest'ultimo combinato
    //    con `backdrop-filter` causa repaint jank brutale su Chromium ad
    //    ogni scroll. Un pseudo-element fixed è invece promosso a un
    //    compositing layer dedicato (GPU), scroll smooth.
    //
    //    Body resta trasparente sopra l'html::before (vedi html selector).
    `[data-theme-effects~="glass"].dark,`,
    `.dark[data-theme-effects~="glass"] {`,
    `  background-color: hsl(var(--background));`,
    `}`,
    `[data-theme-effects~="glass"].dark body,`,
    `.dark[data-theme-effects~="glass"] body {`,
    `  background-color: transparent !important;`,
    `}`,
    `[data-theme-effects~="glass"].dark::before,`,
    `.dark[data-theme-effects~="glass"]::before {`,
    `  content: "";`,
    `  position: fixed;`,
    `  inset: 0;`,
    `  z-index: -1;`,
    `  pointer-events: none;`,
    `  background-image:`,
    `    radial-gradient(ellipse 80% 50% at 15% 0%, hsl(240 100% 30% / 0.35) 0%, transparent 50%),`,
    `    radial-gradient(ellipse 60% 50% at 85% 100%, hsl(285 80% 35% / 0.28) 0%, transparent 50%),`,
    `    radial-gradient(ellipse 100% 60% at 50% 50%, hsl(235 60% 12% / 0.4) 0%, transparent 70%);`,
    `}`,
  ].join('\n');
}

/**
 * <GlassNoiseFilter> — SVG inline che definisce il displacement noise per
 * `filter: url(#desko-glass-noise)`. Montato una volta dal root layout
 * quando il theme attivo richiede glass. Posizionato fixed/invisibile.
 *
 * Tecnica: feTurbulence genera fractal noise → feGaussianBlur lo
 * ammorbidisce → feDisplacementMap sposta i pixel del SourceGraphic.
 *
 * Caveat: applicato a un `::before` distorce SOLO il gradient del before
 * stesso, NON quello dietro (backdrop). Il vero displacement iOS richiede
 * `backdrop-filter: url(...)` (Safari only). Su Chrome/Firefox il noise
 * dà comunque texture vetro percepibile.
 */
export function GlassNoiseFilter({ scale }: { scale: number }) {
  return (
    <svg
      style={{ position: 'fixed', width: 0, height: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <filter id="desko-glass-noise" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.012"
          numOctaves={2}
          seed={92}
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation={2} result="blurNoise" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurNoise"
          scale={scale}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
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
