import {
  allowMockFallback,
  failMeta,
  isForceMock,
  type FetchMeta,
} from './mode';

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function requestJson<T>(
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
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

let mockTotpEnabled = false;

export async function fetchTotpStatus(): Promise<{
  data: { enabled: boolean };
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { enabled: mockTotpEnabled },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ enabled: boolean }>(
      '/api/me/totp/status',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: { enabled: false }, meta: failMeta(err) };
    }
    throw err;
  }
}

export async function setupTotp(): Promise<
  | { ok: true; secret: string; otpauthUri: string }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      secret: 'MOCKSECRETABCDEFGH',
      otpauthUri:
        'otpauth://totp/Tahti:demo@tahti.live?secret=MOCKSECRETABCDEFGH&issuer=Tahti',
    };
  }
  try {
    const { data } = await requestJson<{ secret: string; otpauthUri: string }>(
      '/api/me/totp/setup',
      { method: 'POST' },
    );
    return { ok: true, ...data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Setup failed',
    };
  }
}

export async function confirmTotp(
  code: string,
): Promise<{ ok: true; backupCodes: string[] } | { ok: false; error: string }> {
  if (isForceMock()) {
    if (code.replace(/\s/g, '').length < 6) {
      return { ok: false, error: 'Invalid code' };
    }
    mockTotpEnabled = true;
    return {
      ok: true,
      backupCodes: ['ABCD-1111', 'EFGH-2222', 'IJKL-3333', 'MNOP-4444'],
    };
  }
  try {
    const { data } = await requestJson<{ backupCodes?: string[] }>(
      '/api/me/totp/confirm',
      { method: 'POST', body: JSON.stringify({ code: code.trim() }) },
    );
    return { ok: true, backupCodes: data.backupCodes ?? [] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Confirm failed',
    };
  }
}

export async function disableTotp(
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    if (!password) {
      return { ok: false, error: 'Password required' };
    }
    mockTotpEnabled = false;
    return { ok: true };
  }
  try {
    await requestJson<void>('/api/me/totp/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Disable failed',
    };
  }
}
