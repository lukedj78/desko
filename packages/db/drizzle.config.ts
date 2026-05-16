import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle-kit config — usato per `db:generate` (offline) e `db:studio`.
 *
 * Le migration SQL files vivono dentro `packages/db/migrations/`.
 * Il client runtime (`db/src/index.ts`) usa @neondatabase/serverless WebSocket.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://placeholder:placeholder@placeholder/placeholder',
  },
  verbose: true,
  strict: true,
});
