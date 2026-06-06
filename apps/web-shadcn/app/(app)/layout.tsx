import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/shared/shell/app-shell';
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

  return (
    <>
      {impersonatedBy ? (
        <ImpersonationBanner
          impersonatedUser={{ name: session.user.name, email: session.user.email }}
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
