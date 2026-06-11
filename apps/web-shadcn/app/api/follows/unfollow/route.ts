import type { NextRequest } from 'next/server';

import { unfollowUser } from '@desko/server-actions/presence';

import { actionResponse, errorResponse } from '../../_lib/respond';

/** POST /api/follows/unfollow — smetti di seguire. Body: { targetUserId } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return actionResponse(await unfollowUser(body));
  } catch (e) {
    return errorResponse(e);
  }
}
