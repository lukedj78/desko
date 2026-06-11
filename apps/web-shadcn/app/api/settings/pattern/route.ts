import type { NextRequest } from 'next/server';

import { updateWeeklyPattern } from '@desko/server-actions/presence';

import { actionResponse, errorResponse } from '../../_lib/respond';

/**
 * POST /api/settings/pattern — pattern ricorrente settimanale (US-1).
 * Body: { monday..friday: 'in_office'|'remote'|'unspecified', defaultFloor?: Floor|null }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return actionResponse(await updateWeeklyPattern(body));
  } catch (e) {
    return errorResponse(e);
  }
}
