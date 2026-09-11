import type { FetchMeta } from './client';
import { apiBase } from './http';
import { isForceMock } from './mode';

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

function failMeta(err: unknown): FetchMeta {
  return {
    source: 'mock',
    reason: err instanceof Error ? err.message : 'fetch failed',
  };
}

export type VenueBroadcast = {
  id: string;
  startAt: string;
  endAt: string | null;
  description: string | null;
  channelId: string | null;
  state: 'SCHEDULED' | 'LIVE' | 'CANCELED' | 'ENDED' | string;
};

export type MyVenue = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  countryCode: string;
  description: string | null;
  capacity: number | null;
  latitude: number | null;
  longitude: number | null;
  externalLinks: Record<string, string> | null;
  photos: string[];
  verifiedAt: string | null;
  broadcasts: VenueBroadcast[];
};

const mockVenue: MyVenue = {
  id: 'venue-mock-1',
  slug: 'northern-lights-hall',
  name: 'Northern Lights Hall',
  address: 'Mannerheimintie 1',
  city: 'Helsinki',
  countryCode: 'FI',
  description: 'Small all-ages venue for live streamed sets.',
  capacity: 120,
  latitude: null,
  longitude: null,
  externalLinks: null,
  photos: [],
  verifiedAt: '2026-06-01T00:00:00.000Z',
  broadcasts: [
    {
      id: 'vb-mock-1',
      startAt: '2026-09-05T18:00:00.000Z',
      endAt: '2026-09-05T21:00:00.000Z',
      description: 'Album release show',
      channelId: null,
      state: 'SCHEDULED',
    },
  ],
};

export async function fetchMyVenues(): Promise<{
  data: MyVenue[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [mockVenue],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<MyVenue[]>('/api/me/venues');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export type PatchVenueInput = Partial<{
  name: string;
  address: string;
  city: string;
  countryCode: string;
  description: string | null;
  capacity: number | null;
  externalLinks: Record<string, string> | null;
  photos: string[];
}>;

export async function patchVenue(
  slug: string,
  patch: PatchVenueInput,
): Promise<{ ok: true; data: MyVenue } | { ok: false; error: string }> {
  if (isForceMock()) {
    Object.assign(mockVenue, patch);
    return { ok: true, data: mockVenue };
  }
  try {
    const { data } = await requestJson<MyVenue>(
      `/api/v1/venues/${encodeURIComponent(slug)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export type CreateVenueBroadcastInput = {
  startAt: string;
  endAt?: string;
  description?: string;
  channelId?: string;
};

export async function createVenueBroadcast(
  slug: string,
  input: CreateVenueBroadcastInput,
): Promise<{ ok: true; data: VenueBroadcast } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row: VenueBroadcast = {
      id: `vb-mock-${Date.now()}`,
      startAt: input.startAt,
      endAt: input.endAt ?? null,
      description: input.description ?? null,
      channelId: input.channelId ?? null,
      state: 'SCHEDULED',
    };
    mockVenue.broadcasts = [...mockVenue.broadcasts, row];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<VenueBroadcast>(
      `/api/v1/venues/${encodeURIComponent(slug)}/broadcasts`,
      { method: 'POST', body: JSON.stringify(input) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Booking failed',
    };
  }
}

export async function cancelVenueBroadcast(
  slug: string,
  broadcastId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockVenue.broadcasts = mockVenue.broadcasts.map((b) =>
      b.id === broadcastId ? { ...b, state: 'CANCELED' } : b,
    );
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/v1/venues/${encodeURIComponent(slug)}/broadcasts/${encodeURIComponent(broadcastId)}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Cancel failed',
    };
  }
}
