import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchSoundDownloadGateStats } from './sound-download-gate';

describe('fetchSoundDownloadGateStats', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads one track's gate funnel", async () => {
    const stats = {
      repostToDownload: true,
      followToDownload: false,
      artistFollowerCount: 5,
      repostAckCount: 2,
      blockedDownloadAttempts: 1,
      countedDownloadCount: 4,
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(stats), { status: 200 }));
    await expect(fetchSoundDownloadGateStats('s 1')).resolves.toMatchObject({
      data: stats,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/sound/s%201/download-gate-stats',
    );
  });

  it('returns no stats when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 404 }),
    );
    await expect(fetchSoundDownloadGateStats('s1')).resolves.toMatchObject({
      data: null,
    });
  });
});
