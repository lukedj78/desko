import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

import * as schema from './schema';

/**
 * createTestDb — istanza Drizzle su PGlite (Postgres in-process) con lo
 * schema reale applicato via i file di migrazione SQL.
 *
 * Per i test di integrazione: stessa semantica SQL di Neon (enum, unique,
 * FK, EXISTS) senza rete né credenziali. Ogni chiamata = DB nuovo e isolato.
 *
 * Uso tipico in un test file:
 *
 *   vi.mock('@desko/db', async () => {
 *     const { createTestDb } = await import('@desko/db/testing');
 *     return { db: await createTestDb() };
 *   });
 */
export async function createTestDb() {
  const client = new PGlite();
  const migrationsDir = fileURLToPath(new URL('../migrations', import.meta.url));

  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    // drizzle-kit separa gli statement con questo marker
    for (const statement of sql.split('--> statement-breakpoint')) {
      const trimmed = statement.trim();
      if (trimmed) await client.exec(trimmed);
    }
  }

  return drizzle({ client, schema, casing: 'snake_case' });
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;
