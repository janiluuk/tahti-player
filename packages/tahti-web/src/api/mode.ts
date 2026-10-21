/**
 * Live vs mock mode helpers.
 *
 * - `VITE_FORCE_MOCK=1` — full offline demo (no network).
 * - Production / beta builds — real API only; failed GETs return empty + error meta
 *   (no silent “Northern Lights” fixtures).
 * - Vite `dev` — still allows mock fallback when the API is down, unless
 *   `VITE_ALLOW_MOCK_FALLBACK=0`.
 * - `VITE_ALLOW_MOCK_FALLBACK=1` — force fallback on even in production (emergency).
 */

export type FetchMeta = { source: 'api' | 'mock'; reason?: string };

export function isForceMock(): boolean {
  return import.meta.env.VITE_FORCE_MOCK === '1';
}

export function allowMockFallback(): boolean {
  if (isForceMock()) {
    return true;
  }
  if (import.meta.env.VITE_ALLOW_MOCK_FALLBACK === '1') {
    return true;
  }
  if (import.meta.env.VITE_ALLOW_MOCK_FALLBACK === '0') {
    return false;
  }
  return Boolean(import.meta.env.DEV);
}

/** API failed and the caller is returning empty/null stand-in data — not a
 * successful mock fixture. Views that check `meta.source === 'api'` can show
 * PageError / Retry instead of treating the empty stand-in as a real empty. */
export function apiErrorMeta(err: unknown): FetchMeta {
  return {
    source: 'api',
    reason: err instanceof Error ? err.message : 'fetch failed',
  };
}

/** @deprecated Use `apiErrorMeta` for empty stand-ins, or `mockFallbackMeta`
 * when returning intentional mock fixture data after an API failure. */
export function failMeta(err: unknown): FetchMeta {
  return apiErrorMeta(err);
}

/** API failed but the caller is returning mock fixture data (dev fallback or
 * an explicit mock stand-in). `source: 'mock'` so listeners can tell. */
export function mockFallbackMeta(err: unknown): FetchMeta {
  return {
    source: 'mock',
    reason: err instanceof Error ? err.message : 'fetch failed',
  };
}

/** Prefer mock fixtures only when fallback is allowed; otherwise empty + api error. */
export function withMockFallback<T>(
  err: unknown,
  mock: () => T,
  empty: () => T,
): { data: T; meta: FetchMeta } {
  if (allowMockFallback()) {
    return { data: mock(), meta: mockFallbackMeta(err) };
  }
  return { data: empty(), meta: apiErrorMeta(err) };
}
