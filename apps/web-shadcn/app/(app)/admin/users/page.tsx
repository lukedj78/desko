import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@desko/auth';
import { getSession } from '@desko/auth/server';

import { UsersAdminClient } from './_components/users-admin';
import type { AdminUser } from './_components/users-admin/types';

export const metadata = { title: 'Gestione utenti' };
export const dynamic = 'force-dynamic';

/**
 * Server Component: legge sessione + carica gli utenti server-side via
 * `auth.api.listUsers` (better-auth admin plugin), passa la lista al Client
 * Component come prop. Niente useEffect lato client, niente Server Action
 * call da Client Component.
 *
 * Pattern canonico data-fetching skill: "Async Server Component — the default".
 */
export default async function AdminUsersPage() {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? 'user';
  if (role !== 'admin') {
    redirect('/admin/analytics');
  }

  let users: AdminUser[] = [];
  let initialError: string | null = null;

  try {
    const result = await auth.api.listUsers({
      query: { limit: 100, sortBy: 'createdAt', sortDirection: 'desc' },
      headers: await nextHeaders(),
    });
    users = (result.users ?? []) as AdminUser[];
  } catch (e) {
    initialError = e instanceof Error ? e.message : 'Impossibile caricare gli utenti.';
  }

  return (
    <UsersAdminClient
      currentUserId={session!.user.id}
      initialUsers={users}
      initialError={initialError}
    />
  );
}
