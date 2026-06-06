/**
 * mapFormError — error router condiviso da tutti i form.
 *
 * Convention: il `save`/`submit` callback DEVE lanciare in caso di failure
 * (mai catchare). Questo helper centralizza la conversione di qualunque
 * errore lanciato in un messaggio user-friendly + opzionale lista field
 * errors (per inline display). Una sola toast call per evitare proliferazione.
 *
 * Discriminated union per gestire 3 categorie:
 * - validation: errori per-field (es. zod schema lato server) → display inline
 * - business: errore atteso (es. "email already taken") → toast + message
 * - unknown: failure imprevista (network, 500) → toast generico + log
 */

export type FormError =
  | { type: 'validation'; fieldErrors: Record<string, string[]>; message?: string }
  | { type: 'business'; message: string }
  | { type: 'unknown'; message: string };

export type MapFormErrorOptions = {
  /**
   * Toast callback opzionale — passare `toast.error` di sonner per integrazione
   * automatica. Se omesso, il caller può comunque leggere `error.message`.
   */
  toast?: (message: string) => void;
};

export function mapFormError(error: unknown, options?: MapFormErrorOptions): FormError {
  // 1) Validation error — convenzione: oggetto con `fieldErrors: Record<string, string[]>`
  if (
    error &&
    typeof error === 'object' &&
    'fieldErrors' in error &&
    typeof (error as { fieldErrors: unknown }).fieldErrors === 'object'
  ) {
    const e = error as {
      fieldErrors: Record<string, string[]>;
      message?: string;
    };
    const result: FormError = {
      type: 'validation',
      fieldErrors: e.fieldErrors,
      message: e.message,
    };
    if (e.message) options?.toast?.(e.message);
    return result;
  }

  // 2) Business error — convenzione: oggetto con `message: string`
  if (error instanceof Error) {
    const result: FormError = { type: 'business', message: error.message };
    options?.toast?.(error.message);
    return result;
  }
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: string }).message === 'string'
  ) {
    const message = (error as { message: string }).message;
    const result: FormError = { type: 'business', message };
    options?.toast?.(message);
    return result;
  }

  // 3) Unknown — fallback generico
  const message = 'Si è verificato un errore. Riprova.';
  console.error('[mapFormError] unknown error:', error);
  options?.toast?.(message);
  return { type: 'unknown', message };
}
