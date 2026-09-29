import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchMyPurchaseOrders } from './purchase-tiers';

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
