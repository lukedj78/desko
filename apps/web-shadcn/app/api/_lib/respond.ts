import { NextResponse } from 'next/server';

import type { ActionResult } from '@desko/domain';

/**
 * Mappa il contratto ActionResult delle server actions su HTTP JSON
 * per i client non-Next (app mobile Expo).
 *
 *   ok:true  → 200 { data }
 *   ok:false → 400 { error, fieldErrors? }  (validazione/regole di business)
 */
export function actionResponse<T>(result: ActionResult<T>) {
  if (result.ok) {
    return NextResponse.json({ data: result.data });
  }
  return NextResponse.json(
    { error: result.message, fieldErrors: result.fieldErrors ?? null },
    { status: 400 },
  );
}

/** Errori thrown (getCurrentUserId, bug): 401 per UNAUTHORIZED, altrimenti 500. */
export function errorResponse(e: unknown) {
  const message = e instanceof Error ? e.message : 'INTERNAL_ERROR';
  return NextResponse.json(
    { error: message },
    { status: message === 'UNAUTHORIZED' ? 401 : 500 },
  );
}
