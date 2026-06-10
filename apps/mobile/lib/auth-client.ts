import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

/**
 * Client better-auth per Expo — stesso backend del web
 * (apps/web-shadcn /api/auth, config condivisa in @desko/auth).
 *
 * - baseURL = origin dell'app web (il client appende /api/auth da solo)
 * - sessione persistita su SecureStore, inviata come header Cookie
 * - `getCookie()` è usato da lib/api.ts per autenticare le chiamate dati
 */
export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [
    expoClient({
      scheme: 'desko',
      storagePrefix: 'desko',
      storage: SecureStore,
    }),
  ],
});

export const { signIn, signOut, signUp, useSession, getCookie } = authClient;
