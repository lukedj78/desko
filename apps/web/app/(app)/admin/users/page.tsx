import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth-server';

import { UsersAdminClient } from './_components/users-admin-client';

export const metadata = { title: 'Gestione utenti' };

/**
 * /admin/users — solo admin. hr_analytics ha la lista (read) ma per
 * convenzione UI lo mandiamo direttamente alla sua pagina di analytics.
 */
export default async function AdminUsersPage() {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? 'user';
  if (role !== 'admin') {
    redirect('/admin/analytics');
  }

  return <UsersAdminClient currentUserId={session!.user.id} />;
}
