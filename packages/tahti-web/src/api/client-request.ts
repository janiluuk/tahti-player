import { apiErrorDetail, type ApiErrorBody } from './api-error-detail';
import { getAuthSession } from './auth-session-client';
import { apiBase } from './http';

/** Browser calls go through Vite proxy → Tahti API (avoids CORS). */
export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number; headers: Headers }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const headers = {
    Accept: 'application/json',
    ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
    ...initHeaders,
  };
  const url = `${apiBase()}${path}`;
  const skipAuthRefresh =
    path.startsWith('/api/auth/login') ||
    path.startsWith('/api/auth/token/refresh') ||
    path.startsWith('/api/auth/logout') ||
    path.startsWith('/api/auth/register');
  const res = skipAuthRefresh
    ? await fetch(url, {
        credentials: 'include',
        ...rest,
        headers,
      })
    : await getAuthSession().fetchWithAuth(url, {
        credentials: 'include',
        ...rest,
        headers,
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
