import type { NextRequest } from 'next/server';

import { cancelLunchProposal } from '@desko/server-actions/lunch';

import { actionResponse, errorResponse } from '../../_lib/respond';

/** POST /api/lunch/cancel — cancella una proposta (solo creator). Body: { proposalId } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return actionResponse(await cancelLunchProposal(body));
  } catch (e) {
    return errorResponse(e);
  }
}
