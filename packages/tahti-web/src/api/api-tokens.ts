import type { FetchMeta } from './client';
import { apiBase } from './http';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let detail = `${path} → ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      detail = body.error ?? detail;
    } catch {
      // The status is enough when the server did not return JSON.
    }
    throw new Error(detail);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export type ApiToken = {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: Array<'read' | 'write'>;
  lastUsedAt: string | null;
  createdAt: string;
};

export type CreatedApiToken = ApiToken & { token: string };

let mockTokens: ApiToken[] = [
  {
    id: 'token-mock-1',
    name: 'Local development',
    tokenPrefix: 'tk_live_demo',
    scopes: ['read'],
    lastUsedAt: null,
    createdAt: '2026-08-01T12:00:00.000Z',
  },
];

export async function fetchApiTokens(): Promise<{
  data: ApiToken[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...mockTokens],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await requestJson<ApiToken[]>('/api/me/api-tokens');
    return { data, meta: { source: 'api' } };
  } catch (error) {
    if (allowMockFallback()) {
      return { data: [...mockTokens], meta: failMeta(error) };
    }
    return { data: [], meta: apiErrorMeta(error) };
  }
}

export async function createApiToken(
  name: string,
  scopes: Array<'read' | 'write'>,
): Promise<{ ok: true; data: CreatedApiToken } | { ok: false; error: string }> {
  if (isForceMock()) {
    const token: CreatedApiToken = {
      id: `token-mock-${Date.now()}`,
      name,
      tokenPrefix: 'tk_live_mock',
      scopes,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
      token: `tk_live_mock_${Date.now()}`,
    };
    const view: ApiToken = {
      id: token.id,
      name: token.name,
      tokenPrefix: token.tokenPrefix,
      scopes: token.scopes,
      lastUsedAt: token.lastUsedAt,
      createdAt: token.createdAt,
    };
    mockTokens = [view, ...mockTokens];
    return { ok: true, data: token };
  }
  try {
    const data = await requestJson<CreatedApiToken>('/api/me/api-tokens', {
      method: 'POST',
      body: JSON.stringify({ name, scopes }),
    });
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to create token',
    };
  }
}

export async function revokeApiToken(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockTokens = mockTokens.filter((token) => token.id !== id);
    return { ok: true };
  }
  try {
    await requestJson<void>(`/api/me/api-tokens/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to revoke token',
    };
  }
}
