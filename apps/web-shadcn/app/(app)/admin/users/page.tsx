import { redirect } from 'next/navigation';

import { getSession } from '@desko/auth/server';

import { UsersAdminClient } from './_components/users-admin';

export const metadata = { title: 'Gestione utenti' };

export default async function AdminUsersPage() {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? 'user';
  if (role !== 'admin') {
    redirect('/admin/analytics');
  }
  return <UsersAdminClient currentUserId={session!.user.id} />;
}
