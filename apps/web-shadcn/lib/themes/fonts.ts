import {
  Crimson_Text,
  Fraunces,
  Geist,
  Geist_Mono,
  IBM_Plex_Sans,
  Inter,
  JetBrains_Mono,
  Manrope,
  Space_Grotesk,
} from 'next/font/google';

import type { FontKey } from './types';

/**
 * Pre-load di tutte le famiglie tipografiche supportate dai temi.
 * Ogni font registra la propria CSS variable (es. --font-inter).
 * Il theme attivo decide quale variable mappare a --font-sans /
 * --font-display / --font-mono via inline <style> (vedi ThemeInjector).
 *
 * Aggiungere un font qui: append + aggiornare FontKey in types.ts.
 */

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'], display: 'swap' });
const geist = Geist({ variable: '--font-geist', subsets: ['latin'], display: 'swap' });
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});
const ibmPlex = IBM_Plex_Sans({
  variable: '--font-ibm-plex',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});
const fraunces = Fraunces({ variable: '--font-fraunces', subsets: ['latin'], display: 'swap' });
const crimson = Crimson_Text({
  variable: '--font-crimson',
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const ALL_FONTS = [
  inter,
  manrope,
  geist,
  spaceGrotesk,
  ibmPlex,
  fraunces,
  crimson,
  jetbrainsMono,
  geistMono,
] as const;

/** Stringa className che include tutte le var font — applicata su <html>. */
export const ALL_FONTS_CLASSNAME = ALL_FONTS.map((f) => f.variable).join(' ');

/**
 * Lookup da FontKey logico (es. "Manrope") alla CSS var name (es. "--font-manrope").
 * Il theme YAML usa il nome leggibile, qui mappiamo alla variable Next.js.
 */
export const FONT_TO_VAR: Record<FontKey, string> = {
  Inter: '--font-inter',
  Manrope: '--font-manrope',
  Geist: '--font-geist',
  'Space Grotesk': '--font-space-grotesk',
  'IBM Plex Sans': '--font-ibm-plex',
  Fraunces: '--font-fraunces',
  'Crimson Text': '--font-crimson',
  'JetBrains Mono': '--font-jetbrains',
  'Geist Mono': '--font-geist-mono',
};
