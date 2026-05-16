import { headers } from 'next/headers';
import { cache } from 'react';

import { auth } from '@/lib/auth';
import type { AppRole } from '@/lib/auth-permissions';

/**
 * Helper server-side per leggere/validare la sessione.
 *
 * `cache()` di React deduplica le chiamate dentro lo stesso request:
 * 3 RSC che chiamano getSession() = 1 sola query DB.
 *
 * Tutti i `require*()` lanciano errori non gestiti. In RSC questo viene catturato
 * dal nearest `error.tsx` (HTTP 500). Per redirect "soft" verso /login, fai il
 * check via `getSession()` + `redirect('/login')` invece.
 */

export const getSession = cache(async () => {
  return await auth.api.getSession({ headers: await headers() });
});

export async function getCurrentUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }
  return session.user.id;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  return session.user;
}

/**
 * Estrae il ruolo dell'utente corrente dalla session.
 * Ritorna 'user' come fallback se il campo è null/undefined nel DB.
 */
export async function getCurrentRole(): Promise<AppRole> {
  const user = await getCurrentUser();
  const role = (user as { role?: string }).role;
  if (role === 'admin' || role === 'hr_analytics') return role;
  return 'user';
}

/**
 * Gate per ruolo singolo. Throwa "FORBIDDEN" se l'utente non ha il ruolo.
 *
 *   await requireAdmin();  // /admin/* layout
 */
export async function requireAdmin(): Promise<void> {
  const role = await getCurrentRole();
  if (role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Gate per uno qualsiasi tra i ruoli specificati.
 *
 *   await requireRole(['admin', 'hr_analytics']);  // /admin/analytics
 */
export async function requireRole(allowed: AppRole[]): Promise<void> {
  const role = await getCurrentRole();
  if (!allowed.includes(role)) {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Permission check granulare via better-auth ACL.
 *
 *   await requirePermission({ hr: ['view-aggregate'] });
 *
 * Equivalente a `auth.api.userHasPermission()`. Throwa FORBIDDEN se nego.
 * Da preferire a `requireRole()` quando c'è un'azione specifica da gateare.
 */
export async function requirePermission(
  permissions: Record<string, string[]>,
): Promise<void> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  const role = (session.user as { role?: string }).role ?? 'user';
  const result = await auth.api.userHasPermission({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: { role, permissions } as any,
  });
  if (!result.success) {
    throw new Error('FORBIDDEN');
  }
}
