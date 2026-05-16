import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

import { env } from '@/lib/env';
import * as schema from './schema';

/**
 * Drizzle client per Neon Postgres (driver neon-serverless con WebSocket).
 *
 * Doc Drizzle: il driver neon-serverless WebSocket è "drop-in replacement
 * for the pg driver" — funziona ovunque (runtime app + script Node + edge):
 *   - Browser/Edge: usa il WebSocket globale
 *   - Node: richiede `ws` (installato come dep)
 *
 * Vantaggi vs neon-http:
 *   - Supporta transazioni multi-statement
 *   - Funziona uniformemente da runtime app, edge proxy, script CLI (seed)
 *
 * Trade-off vs neon-http: leggermente più lento in cold-start su edge
 * (handshake WebSocket). Per il nostro tool interno è trascurabile.
 *
 * Use:
 *   import { db } from '@/lib/db';
 *   import { presenceEntries } from '@/lib/db/schema';
 *   const rows = await db.select().from(presenceEntries).where(...);
 */

// In Node il `WebSocket` globale non c'è — iniettiamo `ws`.
// In edge/browser è già disponibile e questo no-op.
if (typeof globalThis.WebSocket === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ws = require('ws');
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle({ client: pool, schema, casing: 'snake_case' });

export { schema };
