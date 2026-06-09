import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { ALL_FONTS_CLASSNAME } from '@/lib/themes/fonts';
import {
  getTheme,
  DEFAULT_THEME_ID,
  THEME_COOKIE_NAME,
  THEME_MODE_COOKIE_NAME,
  parseThemeMode,
} from '@/lib/themes/registry.server';
import {
  GlassNoiseFilter,
  ThemeInjector,
  getActiveGlassEffect,
} from '@/lib/themes/theme-injector';

import './globals.css';

export const metadata: Metadata = {
  title: 'Desko · shadcn port',
  description: 'Sai chi sarà in ufficio quando ci sarai tu.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Theme attivo letto dal cookie (admin imposta via /settings)
  const cookieStore = await cookies();
  const activeThemeId = cookieStore.get(THEME_COOKIE_NAME)?.value ?? DEFAULT_THEME_ID;
  const theme = await getTheme(activeThemeId);

  // Mode (light/dark) — preferenza utente, persistita su cookie HTTP-only.
  // Server-side read → .dark class applicata pre-paint, zero FOUC.
  const themeMode = parseThemeMode(cookieStore.get(THEME_MODE_COOKIE_NAME)?.value);

  // Liquid glass = opt-in del theme: solo se theme.effects.glass è definito,
  // attiviamo gli overrides CSS scoped a [data-theme-effects~="glass"].
  const glass = getActiveGlassEffect(theme);
  const themeEffects = glass ? 'glass' : undefined;

  return (
    <html
      lang="it"
      data-theme-effects={themeEffects}
      className={`${ALL_FONTS_CLASSNAME} h-full antialiased${themeMode === 'dark' ? ' dark' : ''}`}
    >
      <head>
        {theme ? <ThemeInjector theme={theme} /> : null}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* SVG noise filter usato da .bg-card::before quando glass.noiseScale > 0.
         * Definito una volta a livello body, referenziato via url(#desko-glass-noise). */}
        {glass?.noiseScale ? <GlassNoiseFilter scale={glass.noiseScale} /> : null}
        {children}
      </body>
    </html>
  );
}
