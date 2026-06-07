import { cookies } from 'next/headers';

import { getSession } from '@desko/auth/server';

import { loadThemes, DEFAULT_THEME_ID, THEME_COOKIE_NAME } from '@/lib/themes/registry.server';

import { ThemePickerCard } from './_components/theme-picker-card';
import { UserSettingsForm } from './_components/user-settings-form';

export const metadata = { title: 'Impostazioni' };
export const dynamic = 'force-dynamic';

/**
 * /settings — Server Component che monta:
 * - <UserSettingsForm /> (personale, sempre visibile)
 * - <ThemePickerCard /> (visibile solo per admin, sceglie tema visivo
 *   per tutta l'applicazione)
 *
 * Themes letti server-side via loadThemes() (parsing .workflow/themes/*.md),
 * passati come prop al Client Component picker.
 */
export default async function SettingsPage() {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role ?? 'user';
  const isAdmin = role === 'admin';

  // Themes + active id sono nostri solo se admin (eviti dataset inutile lato client)
  const [themes, cookieStore] = await Promise.all([
    isAdmin ? loadThemes() : Promise.resolve([]),
    cookies(),
  ]);
  const activeThemeId = cookieStore.get(THEME_COOKIE_NAME)?.value ?? DEFAULT_THEME_ID;

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-5 py-8 sm:px-6 md:px-8 md:py-12">
      <div className="flex flex-col gap-10">
        <UserSettingsForm />

        {isAdmin && themes.length > 0 ? (
          <ThemePickerCard themes={themes} activeThemeId={activeThemeId} />
        ) : null}
      </div>
    </div>
  );
}
