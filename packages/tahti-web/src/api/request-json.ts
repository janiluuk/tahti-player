import { apiBase } from './http';

/** Thrown by `requestJson` for a non-2xx response; carries the API's
 * machine-readable `code` when the body has one. */
export class RequestJsonError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'RequestJsonError';
  }
}

/** The standard JSON request helper: credentials included, JSON in/out,
 * API `error`/`message` bodies become the thrown message. */
export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    let code: string | undefined;
    try {
      const body = (await res.json()) as {
        error?: string;
        message?: string;
        code?: unknown;
      };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
      if (typeof body.code === 'string') {
        code = body.code;
      }
    } catch {
      // ignore
    }
    throw new RequestJsonError(detail, res.status, code);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}
