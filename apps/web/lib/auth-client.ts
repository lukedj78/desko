'use client';

import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

import { ac, ROLES } from '@/lib/auth-permissions';

/**
 * Auth client lato browser.
 *
 * Use:
 *   import { signIn, signUp, signOut, useSession, admin } from '@/lib/auth-client';
 *
 *   await signIn.email({ email, password });
 *   await signIn.social({ provider: 'microsoft' });
 *   await signOut();
 *   const { data: session, isPending } = useSession();
 *
 * Admin (richiede ruolo `admin`):
 *   await admin.listUsers({ query: { limit: 50 } });
 *   await admin.setRole({ userId, role: 'hr_analytics' });
 *   await admin.banUser({ userId, banReason: '...', banExpiresIn: 86400 });
 */

export const authClient = createAuthClient({
  baseURL:
    typeof window === 'undefined'
      ? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3010'
      : window.location.origin,
  plugins: [adminClient({ ac, roles: ROLES })],
});

export const { signIn, signUp, signOut, useSession, admin, getSession } = authClient;
