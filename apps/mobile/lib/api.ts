import { getCookie } from './auth-client';

/**
 * Fetcher HTTP verso il backend Desko (app web Next, stesse origin di
 * /api/auth). Autenticazione: cookie di sessione better-auth letto da
 * SecureStore via `getCookie()` e inviato come header Cookie.
 *
 * Contratto risposte (vedi apps/web-shadcn/app/api/_lib/respond.ts):
 *   200 → payload JSON (per le mutations: { data })
 *   400 → { error, fieldErrors? }   regole di business/validazione
 *   401 → { error: 'UNAUTHORIZED' } sessione assente/scaduta
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string[]> | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Cookie: getCookie(),
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => null)) as {
    error?: string;
    fieldErrors?: Record<string, string[]> | null;
  } | null;

  if (!res.ok) {
    throw new ApiError(body?.error ?? `HTTP ${res.status}`, res.status, body?.fieldErrors ?? null);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
};

/** YYYY-MM-DD locale (stessa convenzione del backend). */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
