import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchLatestReleases } from './latest-releases';

const release = (id: string, smartLinkSlug: string) => ({
  id,
  title: id,
  type: 'EP',
  releaseDate: '2026-09-25T00:00:00.000Z',
  artworkUrl: null,
  smartLinkSlug,
  artistDisplayName: 'Tahti',
});

describe('fetchLatestReleases', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the newest releases that have a smart link', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ releases: [release('a', 'a'), release('b', '')] }),
          { status: 200 },
        ),
      );
    const result = await fetchLatestReleases(5);
    expect(result.data.map((item) => item.id)).toEqual(['a']);
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/releases/latest?limit=5',
    );
  });

  it('is empty when the request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 500 }),
    );
    await expect(fetchLatestReleases()).resolves.toMatchObject({ data: [] });
  });
});
