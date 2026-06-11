import { NextResponse, type NextRequest } from 'next/server';

import { searchUsers } from '@desko/queries/presence';

import { errorResponse } from '../../_lib/respond';

/**
 * GET /api/users/search?q=... — autocomplete colleghi per "segui" (US-3).
 * Esclude bannati e il richiedente (regole nella query condivisa).
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim();
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }
  try {
    const users = await searchUsers(q, 12);
    return NextResponse.json({ users });
  } catch (e) {
    return errorResponse(e);
  }
}
