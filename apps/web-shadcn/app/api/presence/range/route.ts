import { NextResponse, type NextRequest } from 'next/server';

import { getPresencesForRange } from '@desko/queries/presence';

import { errorResponse } from '../../_lib/respond';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SPAN_DAYS = 62; // ~2 mesi: basta per qualunque griglia mese

/**
 * GET /api/presence/range?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Presenze in_office aggregate per data, per la griglia mese del mobile.
 * Il filtro privacy presenceVisibility è applicato nella query condivisa.
 */
export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from') ?? '';
  const to = request.nextUrl.searchParams.get('to') ?? '';

  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return NextResponse.json(
      { error: 'Parametri from/to richiesti in formato YYYY-MM-DD.' },
      { status: 400 },
    );
  }
  const spanDays = (Date.parse(to) - Date.parse(from)) / 86_400_000;
  if (spanDays < 0 || spanDays > MAX_SPAN_DAYS) {
    return NextResponse.json(
      { error: `Intervallo non valido (max ${MAX_SPAN_DAYS} giorni).` },
      { status: 400 },
    );
  }

  try {
    const days = await getPresencesForRange(from, to);
    return NextResponse.json({ days });
  } catch (e) {
    return errorResponse(e);
  }
}
