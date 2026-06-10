import type { NextRequest } from 'next/server';

import { updateFloor } from '@desko/server-actions/presence';

import { actionResponse, errorResponse } from '../../_lib/respond';

/**
 * POST /api/presence/floor — cambia piano per una data (US-7).
 * Body: { date: 'YYYY-MM-DD', floor: 'seventh_floor'|'second_floor'|null }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return actionResponse(await updateFloor(body));
  } catch (e) {
    return errorResponse(e);
  }
}
