import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchEmbedThumbnail } from './embedThumbnail';

describe('fetchEmbedThumbnail', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the noembed thumbnail for a Spotify track id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        thumbnail_url: 'https://cdn.example/spotify.jpg',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchEmbedThumbnail({
        provider: 'SPOTIFY',
        embedUri: '4cOdK2wGLETKBW3PvgPWqT',
      }),
    ).resolves.toBe('https://cdn.example/spotify.jpg');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        encodeURIComponent(
          'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
        ),
      ),
    );
  });

  it('skips hearthis without a source URL', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      fetchEmbedThumbnail({
        provider: 'HEARTHIS',
        embedUri: '1234567',
      }),
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
