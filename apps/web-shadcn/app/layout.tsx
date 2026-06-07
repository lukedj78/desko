import type { Metadata } from 'next';
import { cookies } from 'next/headers';

import { ALL_FONTS_CLASSNAME } from '@/lib/themes/fonts';
import { getTheme, DEFAULT_THEME_ID, THEME_COOKIE_NAME } from '@/lib/themes/registry.server';
import { ThemeInjector } from '@/lib/themes/theme-injector';

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

  return (
    <html
      lang="it"
      className={`${ALL_FONTS_CLASSNAME} h-full antialiased`}
    >
      <head>
        {theme ? <ThemeInjector theme={theme} /> : null}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
