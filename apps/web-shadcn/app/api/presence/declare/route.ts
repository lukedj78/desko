import type { NextRequest } from 'next/server';

import { declarePresence } from '@desko/server-actions/presence';

import { actionResponse, errorResponse } from '../../_lib/respond';

/**
 * POST /api/presence/declare — dichiara la presenza per un giorno (US-1).
 * Body: { date: 'YYYY-MM-DD', status: 'in_office'|'remote'|'unspecified',
 *         floor?: 'seventh_floor'|'second_floor'|null, note?: string }
 * La validazione Zod vive nella server action condivisa.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return actionResponse(await declarePresence(body));
  } catch (e) {
    return errorResponse(e);
  }
}
