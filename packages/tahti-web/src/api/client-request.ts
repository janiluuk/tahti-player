import { apiErrorDetail, type ApiErrorBody } from './api-error-detail';
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
      detail = apiErrorDetail((await res.json()) as ApiErrorBody, detail);
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
