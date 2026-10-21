import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchDownloadGateStats } from './download-gates';

describe('fetchDownloadGateStats', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the gate funnel', async () => {
    const stats = {
      artistFollowerCount: 9,
      items: [],
      totals: { repostAcks: 1, blockedAttempts: 2, countedDownloads: 3 },
      daily: [],
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(stats), { status: 200 }));
    await expect(fetchDownloadGateStats()).resolves.toMatchObject({
      data: stats,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/download-gate-stats',
    );
  });

  it('returns no stats when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 500 }),
    );
    await expect(fetchDownloadGateStats()).resolves.toMatchObject({
      data: null,
    });
  });
});
