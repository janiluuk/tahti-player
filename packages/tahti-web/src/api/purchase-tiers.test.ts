import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchMyPurchaseOrders,
  setSoundAccess,
  type SoundAccess,
} from './purchase-tiers';

describe('fetchMyPurchaseOrders', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the artist's paid track sales", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    await expect(fetchMyPurchaseOrders()).resolves.toMatchObject({ data: [] });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/purchase-tiers/orders',
    );
  });

  it('returns no rows when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 500 }),
    );
    await expect(fetchMyPurchaseOrders()).resolves.toMatchObject({
      data: null,
    });
  });
});

describe('setSoundAccess', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function sentBody(access: SoundAccess): Promise<unknown> {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(setSoundAccess('s1', access)).resolves.toEqual({ ok: true });
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('/tahti-api/api/me/sound/s1/access');
    expect(init?.method).toBe('PATCH');
    return JSON.parse(String(init?.body));
  }

  it('gates a track to fan subscribers', async () => {
    await expect(
      sentBody({ accessMode: 'SUBSCRIBERS_ONLY', purchaseTierId: 'stale' }),
    ).resolves.toEqual({ accessMode: 'SUBSCRIBERS_ONLY' });
  });

  it('sends the tier only for purchase access', async () => {
    await expect(
      sentBody({ accessMode: 'PURCHASE', purchaseTierId: 't1' }),
    ).resolves.toEqual({ accessMode: 'PURCHASE', purchaseTierId: 't1' });
  });

  it('falls back to free when a purchase gate has no tier', async () => {
    await expect(
      sentBody({ accessMode: 'PURCHASE', purchaseTierId: null }),
    ).resolves.toEqual({ accessMode: 'FREE' });
  });
});
