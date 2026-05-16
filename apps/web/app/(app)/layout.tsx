import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/site/app-shell';
import { getSession } from '@desko/auth/server';

import { ImpersonationBanner } from './_components/impersonation-banner';

// Tutte le pagine dietro AppShell sono session-aware → no static prerender.
export const dynamic = 'force-dynamic';

/**
 * Layout per il route group `(app)`.
 *
 * Anche se `proxy.ts` già intercetta richieste non-autenticate redirigendo
 * a /login, manteniamo `getSession()` qui per:
 *   - Avere `user` disponibile come prop dell'AppShell (UserDropdown).
 *   - Doppia difesa: il proxy controlla solo il cookie, qui validiamo davvero.
 */
export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  // better-auth admin plugin popola `session.session.impersonatedBy` quando
  // un admin sta vedendo l'app come un altro utente.
  const impersonatedBy = (session.session as { impersonatedBy?: string | null })
    .impersonatedBy;

  return (
    <>
      {impersonatedBy ? (
        <ImpersonationBanner
          impersonatedUser={{
            name: session.user.name,
            email: session.user.email,
          }}
        />
      ) : null}
      <AppShell
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
