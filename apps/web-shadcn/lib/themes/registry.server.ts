/**
 * Theme registry — parser dei file .workflow/themes/*.md.
 *
 * Esegue solo server-side (fs/path). Il root layout chiama `loadThemes()`
 * al request render, lookup O(1) per id via `getTheme(id)`.
 *
 * I file sono parsati ad ogni request in dev (hot-reload tema), cacheati
 * in production via React.cache().
 */

import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';

import matter from 'gray-matter';

import type { Theme } from './types';

const THEMES_DIR = path.join(process.cwd(), '..', '..', '.workflow', 'themes');

/**
 * Carica tutti i temi disponibili dalla cartella `.workflow/themes/`.
 * Cached per request via React.cache() — multiple chiamate dentro lo
 * stesso request = 1 sola lettura disco.
 */
export const loadThemes = cache(async (): Promise<Theme[]> => {
  let files: string[];
  try {
    files = fs.readdirSync(THEMES_DIR).filter((f) => f.endsWith('.md'));
  } catch (e) {
    console.error('[themes] cannot read THEMES_DIR:', THEMES_DIR, e);
    return [];
  }

  const themes: Theme[] = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(THEMES_DIR, file), 'utf-8');
      const parsed = matter(raw);
      const data = parsed.data as Record<string, unknown>;

      // Validation minima — meglio un theme skipped che un crash di render
      if (!data['id'] || !data['name'] || !data['colors']) {
        console.warn(`[themes] skipping ${file}: missing required fields`);
        continue;
      }

      themes.push({
        id: String(data['id']),
        name: String(data['name']),
        description: String(data['description'] ?? ''),
        swatch: String(data['swatch'] ?? '#000000'),
        typography: data['typography'] as Theme['typography'],
        radii: data['radii'] as Theme['radii'],
        colors: data['colors'] as Theme['colors'],
        body: parsed.content,
      });
    } catch (e) {
      console.warn(`[themes] failed to parse ${file}:`, e);
    }
  }

  return themes.sort((a, b) => a.name.localeCompare(b.name));
});

/** Lookup di un theme per id, con fallback al primo disponibile o null. */
export async function getTheme(id: string | undefined): Promise<Theme | null> {
  const themes = await loadThemes();
  if (themes.length === 0) return null;
  return themes.find((t) => t.id === id) ?? themes[0] ?? null;
}

export const DEFAULT_THEME_ID = 'desko-ocra';
export const THEME_COOKIE_NAME = 'desko:theme';
