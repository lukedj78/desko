import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { getSession } from '@desko/auth/server';

/**
 * Layout admin: gate per ruoli "elevati" (admin + hr_analytics).
 *
 * - Non loggato → /login
 * - Loggato ma ruolo `user` → /dashboard
 * - Loggato come `admin` o `hr_analytics` → passa, le pagine figlie restringono
 *   ulteriormente quando serve (es. /admin/users richiede solo admin).
 */
const ELEVATED_ROLES = new Set(['admin', 'hr_analytics']);

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const role = (session.user as { role?: string }).role ?? 'user';
  if (!ELEVATED_ROLES.has(role)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
