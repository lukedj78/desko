import { archivePastPresences } from '@desko/server-actions/presence';

import { actionResponse, errorResponse } from '../../_lib/respond';

/**
 * POST /api/settings/archive — diritto all'oblio (US-5, GDPR):
 * elimina lo storico delle presenze passate dell'utente corrente.
 */
export async function POST() {
  try {
    return actionResponse(await archivePastPresences());
  } catch (e) {
    return errorResponse(e);
  }
}
