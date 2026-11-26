import { getJson, requestJson } from './client-request';
import { mockFanTiers } from './mock';
import { getMockSessionUser, mockActivateSubscription } from './mock-session';
import {
  allowMockFallback,
  isForceMock,
  withMockFallback,
  type FetchMeta,
} from './mode';
import type { FanTiersResponse } from './types';

export async function fetchFanTiers(username: string): Promise<{
  data: FanTiersResponse;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockFanTiers(username),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<FanTiersResponse>(
      `/api/v1/u/${encodeURIComponent(username)}/tiers`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return withMockFallback(
      err,
      allowMockFallback() ? () => mockFanTiers(username) : null,
      () => ({
        artist: {
          id: '',
          displayName: username,
          username,
          bio: null,
          avatarUrl: null,
        },
        tiers: [],
        paymentsReady: false,
      }),
    );
  }
}

export async function startFanSubscribe(
  username: string,
  tierId: string,
): Promise<
  | { ok: true; checkoutUrl: string }
  | { ok: true; activated: true; message: string }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    if (!getMockSessionUser()) {
      return { ok: false, error: 'Log in first to activate a fan sub.' };
    }
    const row = mockActivateSubscription(username, tierId);
    return {
      ok: true,
      activated: true,
      message: `Mock subscribed to ${row.tierName} — ${row.artist.displayName}`,
    };
  }
  try {
    const { data, status } = await requestJson<{
      checkoutUrl?: string | null;
      sessionId?: string;
      activated?: boolean;
      tierName?: string;
    }>(`/api/v1/u/${encodeURIComponent(username)}/subscribe`, {
      method: 'POST',
      body: JSON.stringify({ tierId }),
    });
    if (status === 201 || data.activated) {
      return {
        ok: true,
        activated: true,
        message: `Subscribed to ${data.tierName ?? 'tier'} (dev activate)`,
      };
    }
    if (data.checkoutUrl) {
      return { ok: true, checkoutUrl: data.checkoutUrl };
    }
    return { ok: false, error: 'Unexpected subscribe response' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Subscribe failed',
    };
  }
}
