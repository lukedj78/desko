/**
 * Apply Drizzle migrations to Neon Postgres via WebSocket driver.
 *
 *   pnpm --filter @desko/db migrate
 *
 * Driver: `@neondatabase/serverless` Pool con WebSocket — drop-in per pg,
 * funziona col `DATABASE_URL` pooled di Neon.
 */

import { config } from 'dotenv';
import { existsSync } from 'node:fs';

if (existsSync('.env.local')) config({ path: '.env.local' });
config();

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
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('✅ Migrations applicate.');

  await pool.end();
}

run().catch((e) => {
  console.error('❌ Migration fallita:', e);
  process.exit(1);
});
