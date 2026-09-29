import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchNewsletterSubscriberStats } from './posts';

describe('fetchNewsletterSubscriberStats', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the subscriber counts', async () => {
    const stats = {
      total: 3,
      confirmed: 2,
      newLast30Days: 1,
      fanSubscriberCount: 0,
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(stats), { status: 200 }));
    await expect(fetchNewsletterSubscriberStats()).resolves.toMatchObject({
      data: stats,
    });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/me/newsletter/subscribers',
    );
  });

  it('returns no stats when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 500 }),
    );
    await expect(fetchNewsletterSubscriberStats()).resolves.toMatchObject({
      data: null,
    });
  });
});
