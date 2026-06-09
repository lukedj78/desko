import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell, SIDEBAR_COOKIE_NAME } from '@/components/shared/shell/app-shell';
import { THEME_MODE_COOKIE_NAME, parseThemeMode } from '@/lib/themes/registry.server';
import { getSession } from '@desko/auth/server';

import { ImpersonationBanner } from './_components/impersonation-banner';

export const dynamic = 'force-dynamic';

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  const impersonatedBy = (session.session as { impersonatedBy?: string | null })
    .impersonatedBy;

  // Lettura preferenza sidebar dal cookie (server-side) — evita FOUC e
  // rimuove l'useEffect lato client che leggeva localStorage al mount.
  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === '1';
  const themeMode = parseThemeMode(cookieStore.get(THEME_MODE_COOKIE_NAME)?.value);

  return (
    <>
      {impersonatedBy ? (
        <ImpersonationBanner
          impersonatedUser={{ name: session.user.name, email: session.user.email }}
        />
      ) : null}
      <AppShell
        initialCollapsed={initialCollapsed}
        mode={themeMode}
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: (session.user as { role?: string }).role,
        }}
      >
        {children}
      </AppShell>
    </>
  );
}
