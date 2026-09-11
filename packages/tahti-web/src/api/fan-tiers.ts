import type { FetchMeta } from './client';
import { apiBase } from './http';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';

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

export type FanTierRow = {
  id: string;
  name: string;
  amountCents: number;
  description?: string | null;
  perks?: string[] | null;
  active?: boolean;
};

let mockTiers: FanTierRow[] = [
  {
    id: 'tier-mock-1',
    name: 'Supporter',
    amountCents: 500,
    description: 'Mock fan tier',
    perks: ['FAN_CHAT', 'FAN_NEWSLETTER'],
    active: true,
  },
];

export async function fetchMyFanTiers(): Promise<{
  data: FanTierRow[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockTiers.map((t) => ({ ...t })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<FanTierRow[]>('/api/me/fan-tiers');
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockTiers.map((t) => ({ ...t })), meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function createFanTier(input: {
  name: string;
  amountCents: number;
  description?: string;
  perks?: string[];
}): Promise<{ ok: true; data?: FanTierRow } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row: FanTierRow = {
      id: `tier-mock-${Date.now()}`,
      name: input.name,
      amountCents: input.amountCents,
      description: input.description ?? null,
      perks: input.perks ?? [],
      active: true,
    };
    mockTiers = [row, ...mockTiers];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<FanTierRow>('/api/me/fan-tiers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function setFanTierActive(
  id: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockTiers = mockTiers.map((t) => (t.id === id ? { ...t, active } : t));
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/fan-tiers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
}
