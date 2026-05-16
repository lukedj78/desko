'use client';

import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { ac, ROLES } from '@desko/auth/permissions';

/**
 * Auth client lato browser (shadcn app, porta 3020).
 *
 *   import { signIn, signUp, signOut, useSession, admin } from '@/lib/auth-client';
 */

export const authClient = createAuthClient({
  baseURL:
    typeof window === 'undefined'
      ? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3020'
      : window.location.origin,
  plugins: [adminClient({ ac, roles: ROLES })],
});

export const { signIn, signUp, signOut, useSession, admin, getSession } = authClient;
