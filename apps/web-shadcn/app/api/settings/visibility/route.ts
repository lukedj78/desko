import type { NextRequest } from 'next/server';

import { updateVisibility } from '@desko/server-actions/presence';

import { actionResponse, errorResponse } from '../../_lib/respond';

/**
 * POST /api/settings/visibility — visibilità presenze (US-5).
 * Body: { visibility: 'company'|'team'|'followers'|'hidden' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return actionResponse(await updateVisibility(body));
  } catch (e) {
    return errorResponse(e);
  }
}
