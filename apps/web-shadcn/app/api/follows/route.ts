import { NextResponse } from 'next/server';

import { getMyFollows } from '@desko/queries/presence';

import { errorResponse } from '../_lib/respond';

/** GET /api/follows — colleghi seguiti dall'utente corrente (US-3). */
export async function GET() {
  try {
    const follows = await getMyFollows();
    return NextResponse.json({ follows });
  } catch (e) {
    return errorResponse(e);
  }
}
