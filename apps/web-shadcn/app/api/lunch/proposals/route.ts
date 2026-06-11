import { NextResponse, type NextRequest } from 'next/server';

import { getLunchProposalsForDate } from '@desko/queries/lunch';
import { createLunchProposal } from '@desko/server-actions/lunch';

import { actionResponse, errorResponse } from '../../_lib/respond';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/lunch/proposals[?date=YYYY-MM-DD] — proposte visibili all'utente
 * per la data (default oggi). Le private compaiono solo a creator/invitati/
 * partecipanti (regola nel servizio condiviso).
 */
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') ?? undefined;
  if (date && !DATE_RE.test(date)) {
    return NextResponse.json({ error: 'Parametro date non valido.' }, { status: 400 });
  }
  try {
    const proposals = await getLunchProposalsForDate(date);
    return NextResponse.json({ proposals });
  } catch (e) {
    return errorResponse(e);
  }
}

/**
 * POST /api/lunch/proposals — crea una proposta.
 * Body: { restaurantId, date, meetingTime, visibility, note?, maxParticipants?, inviteUserIds? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return actionResponse(await createLunchProposal(body));
  } catch (e) {
    return errorResponse(e);
  }
}
