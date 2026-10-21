import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchReleaseSmartLinkAnalytics } from './release-analytics';

describe('fetchReleaseSmartLinkAnalytics', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads a release's smart-link views and clicks", async () => {
    const body = {
      releaseId: 'r1',
      smartLinkSlug: 'night-drive',
      smartLinkViewCount: 10,
      totalClicks: 3,
      clicksByPlatform: { spotify: 3 },
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    await expect(fetchReleaseSmartLinkAnalytics('r1')).resolves.toMatchObject({
      data: body,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/releases/r1/analytics',
    );
  });

  it('returns nothing when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 404 }),
    );
    await expect(fetchReleaseSmartLinkAnalytics('r1')).resolves.toMatchObject({
      data: null,
    });
  });
});
