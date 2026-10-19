import { apiBase } from './http';

/** Browser calls go through Vite proxy → Tahti API (avoids CORS). */
export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number; headers: Headers }> {
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
    try {
      const body = (await res.json()) as {
        error?: string;
        message?: string;
        issues?: Array<{ path?: Array<string | number>; message?: string }>;
      };
      if (body.issues?.length) {
        const parts = body.issues
          .map((issue) => {
            const field = Array.isArray(issue.path)
              ? issue.path.filter((part) => part !== 'body').join('.')
              : '';
            const message = issue.message?.trim();
            if (!message) {
              return null;
            }
            return field ? `${field}: ${message}` : message;
          })
          .filter((part): part is string => Boolean(part));
        if (parts.length) {
          detail = parts.join(' · ');
        } else if (body.error || body.message) {
          detail = body.error ?? body.message ?? detail;
        }
      } else if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return {
      data: undefined as T,
      status: res.status,
      headers: res.headers,
    };
  }
  return {
    data: (await res.json()) as T,
    status: res.status,
    headers: res.headers,
  };
}
