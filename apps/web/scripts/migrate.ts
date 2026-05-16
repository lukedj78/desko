/**
 * Apply Drizzle migrations to Neon Postgres via WebSocket driver.
 *
 * Workflow:
 *   1. Modifica `lib/db/schema.ts`
 *   2. `pnpm db:generate` — genera SQL files in `lib/db/migrations/` (offline, no DB)
 *   3. `pnpm db:migrate` — applica le migrations al DB (questo script)
 *
 * Driver: `@neondatabase/serverless` Pool con WebSocket. Funziona col `DATABASE_URL`
 * pooled (host con `-pooler`) — nessun bisogno di un URL "unpooled" separato.
 *
 * Doc Drizzle: il driver neon-serverless WebSocket è "drop-in replacement for pg",
 * supporta sia runtime sia migrations.
 */

import { config } from 'dotenv';
import { existsSync } from 'node:fs';

// Carica .env.local PRIMA di .env (Next-style precedence)
if (existsSync('.env.local')) config({ path: '.env.local' });
config();

// Dynamic imports DOPO config() — garantisce env caricato prima dei moduli
const { neonConfig, Pool } = await import('@neondatabase/serverless');
const { drizzle } = await import('drizzle-orm/neon-serverless');
const { migrate } = await import('drizzle-orm/neon-serverless/migrator');
const ws = (await import('ws')).default;

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL;
if (!url || url.includes('placeholder')) {
  console.error('❌ DATABASE_URL non configurata. Imposta `.env.local`.');
  process.exit(1);
}

async function run() {
  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool });

  console.log('🔄 Applico migrations…');
  await migrate(db, { migrationsFolder: './lib/db/migrations' });
  console.log('✅ Migrations applicate.');

  await pool.end();
}

run().catch((e) => {
  console.error('❌ Migration fallita:', e);
  process.exit(1);
});
