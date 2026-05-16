import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { createRequire } from 'node:module';

import { env } from '@desko/env';

import * as schema from './schema';

/**
 * Drizzle client per Neon Postgres (driver neon-serverless con WebSocket).
 * In Node il `WebSocket` globale non c'è — iniettiamo `ws` via `createRequire`
 * (compatibile ESM/CJS).
 */
if (typeof globalThis.WebSocket === 'undefined') {
  const require = createRequire(import.meta.url);
  const ws = require('ws');
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle({ client: pool, schema, casing: 'snake_case' });

export { schema };
