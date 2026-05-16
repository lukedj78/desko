import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

/**
 * Drizzle-kit config — usato solo per `db:generate` (genera SQL files offline).
 *
 * Per applicare le migrations usiamo `scripts/migrate.ts` con il driver
 * `@neondatabase/serverless` (WebSocket) — niente bisogno di un URL "unpooled".
 *
 * Workflow:
 *   1. Modifica `lib/db/schema.ts`
 *   2. `pnpm db:generate` — drizzle-kit genera SQL files in `lib/db/migrations/`
 *   3. `pnpm db:migrate` — `tsx scripts/migrate.ts` applica le migration via WebSocket
 *
 * `db:generate` lavora offline confrontando schema.ts col journal: non serve
 * connettersi al DB, l'`url` qui sotto è solo per `db:studio` / `db:check`.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://placeholder:placeholder@placeholder/placeholder',
  },
  verbose: true,
  strict: true,
});
