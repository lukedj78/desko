'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { getSession } from '@desko/auth/server';

import {
  loadThemes,
  THEME_COOKIE_NAME,
  THEME_MODE_COOKIE_NAME,
  type ThemeMode,
} from './registry.server';

/**
 * setActiveTheme — server action per cambiare tema attivo.
 *
 * Auth: solo `role === 'admin'`. Persistenza: cookie HTTP-only,
 * SameSite=Lax, 1 anno. Su success invalida la cache di tutta
 * l'app (revalidatePath '/' con type 'layout') così il prossimo
 * navigate ri-renderizza con il nuovo theme.
 */
export async function setActiveTheme(themeId: string): Promise<
  | { ok: true }
  | { ok: false; message: string }
> {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'admin') {
    return { ok: false, message: 'Solo gli admin possono cambiare tema.' };
  }

  // Validate id contro lista temi disponibili (no arbitrary cookie write)
  const themes = await loadThemes();
  if (!themes.find((t) => t.id === themeId)) {
    return { ok: false, message: `Tema "${themeId}" non trovato.` };
  }

  const store = await cookies();
  store.set({
    name: THEME_COOKIE_NAME,
    value: themeId,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 anno
  });

  // Invalida cache di tutta l'app → next request re-renderizza con nuovo theme
  revalidatePath('/', 'layout');

  return { ok: true };
}

/**
 * setThemeMode — server action per cambiare light/dark mode.
 *
 * Auth: solo utente autenticato (preferenza personale, NON admin-only).
 * Persistenza: cookie HTTP-only, SameSite=Lax, 1 anno.
 * Su success invalida la cache `'/'` layout → re-render server-side con
 * il nuovo mode già applicato (no FOUC, no JS flash).
 */
export async function setThemeMode(
  mode: ThemeMode,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session?.user) {
    return { ok: false, message: 'Non autenticato.' };
  }
  if (mode !== 'light' && mode !== 'dark') {
    return { ok: false, message: 'Mode non valido.' };
  }

  const store = await cookies();
  store.set({
    name: THEME_MODE_COOKIE_NAME,
    value: mode,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath('/', 'layout');
  return { ok: true };
}
