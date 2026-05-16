import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { getSession } from '@desko/auth/server';

const ELEVATED_ROLES = new Set(['admin', 'hr_analytics']);

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  const role = (session.user as { role?: string }).role ?? 'user';
  if (!ELEVATED_ROLES.has(role)) redirect('/dashboard');
  return <>{children}</>;
}
