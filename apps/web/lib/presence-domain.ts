/**
 * Tipi e costanti del dominio "presence" — separati da `lib/server/presence.ts`
 * perché Next.js richiede che i file `'use server'` esportino SOLO async functions.
 *
 * Importa da qui:
 *   import { type Floor, FLOOR_META } from '@/lib/presence-domain';
 *
 * Importa le ACTIONS da `@/lib/server/presence`.
 */

export type PresenceStatus = 'in_office' | 'remote' | 'unspecified';

/**
 * I due piani fisici dell'azienda (US-7).
 *  - `seventh_floor`: 7° Piano (stanza)
 *  - `second_floor`: 2° Piano (Co-working con bar)
 *  - `null`: piano non specificato (l'utente è in ufficio ma non ha dichiarato dove)
 */
export type Floor = 'seventh_floor' | 'second_floor';

export const FLOOR_META: Record<Floor, { label: string; shortLabel: string; description: string }> = {
  seventh_floor: {
    label: '7° Piano',
    shortLabel: '7°',
    description: 'Stanza con scrivanie tradizionali',
  },
  second_floor: {
    label: '2° Piano',
    shortLabel: '2°',
    description: 'Co-working aperto con bar',
  },
};

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };
