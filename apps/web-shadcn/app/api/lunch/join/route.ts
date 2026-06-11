import type { NextRequest } from 'next/server';

import { joinLunchProposal } from '@desko/server-actions/lunch';

import { actionResponse, errorResponse } from '../../_lib/respond';

/** POST /api/lunch/join — unisciti a una proposta. Body: { proposalId } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return actionResponse(await joinLunchProposal(body));
  } catch (e) {
    return errorResponse(e);
  }
}
