import type { NextRequest } from 'next/server';

import { followUser } from '@desko/server-actions/presence';

import { actionResponse, errorResponse } from '../../_lib/respond';

/** POST /api/follows/follow — segui un collega. Body: { targetUserId } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return actionResponse(await followUser(body));
  } catch (e) {
    return errorResponse(e);
  }
}
