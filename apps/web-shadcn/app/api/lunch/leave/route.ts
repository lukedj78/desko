import type { NextRequest } from 'next/server';

import { leaveLunchProposal } from '@desko/server-actions/lunch';

import { actionResponse, errorResponse } from '../../_lib/respond';

/** POST /api/lunch/leave — lascia una proposta (non creator). Body: { proposalId } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return actionResponse(await leaveLunchProposal(body));
  } catch (e) {
    return errorResponse(e);
  }
}
