/**
 * Live vs mock mode helpers.
 *
 * - `VITE_FORCE_MOCK=1` — full offline demo (no network).
 * - Production / beta builds — real API only; failed GETs return empty + error meta
 *   (no silent “Northern Lights” fixtures).
 * - Vite `dev` — still allows mock fallback when the API is down, unless
 *   `VITE_ALLOW_MOCK_FALLBACK=0`.
 * - `VITE_ALLOW_MOCK_FALLBACK=1` — force fallback on even in production (emergency).
 *
 * Both flag functions read `import.meta.env` on every call (tests flip it with
 * `vi.stubEnv`) and must stay single env expressions: Vite inlines the env
 * values and Rollup folds the call to a literal, which is what lets a
 * production build drop the `api/mock*` fixtures behind `if (isForceMock())`.
 */

export type FetchMeta = { source: 'api' | 'mock'; reason?: string };

export function isForceMock(): boolean {
  return import.meta.env.VITE_FORCE_MOCK === '1';
}

export function allowMockFallback(): boolean {
  return (
    import.meta.env.VITE_FORCE_MOCK === '1' ||
    import.meta.env.VITE_ALLOW_MOCK_FALLBACK === '1' ||
    (import.meta.env.VITE_ALLOW_MOCK_FALLBACK !== '0' &&
      import.meta.env.DEV === true)
  );
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

/** Prefer mock fixtures only when fallback is allowed; otherwise empty + api error.
 * Pass `null` for `mock` when fixtures are compile-time disabled so the mock
 * module is not referenced from production call sites. */
export function withMockFallback<T>(
  err: unknown,
  mock: (() => T) | null,
  empty: () => T,
): { data: T; meta: FetchMeta } {
  if (mock && allowMockFallback()) {
    return { data: mock(), meta: mockFallbackMeta(err) };
  }
  return { data: empty(), meta: apiErrorMeta(err) };
}
