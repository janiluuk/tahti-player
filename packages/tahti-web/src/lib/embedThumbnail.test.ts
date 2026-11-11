import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchEmbedThumbnail, hearthisApiUrl } from './embedThumbnail';

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

  it('reads hearthis artwork from the public API when the page URL is known', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        artwork_url: 'https://img.hearthis.at/small.jpg',
        artwork_url_retina: 'https://img.hearthis.at/retina.jpg',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchEmbedThumbnail({
        provider: 'HEARTHIS',
        embedUri: '14624101',
        sourceUrl: 'https://hearthis.at/candana-dj/credo/',
      }),
    ).resolves.toBe('https://img.hearthis.at/retina.jpg');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api-v2.hearthis.at/candana-dj/credo/',
    );
  });

  it('caches a failed hearthis lookup instead of retrying it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetchMock);
    const input = {
      provider: 'HEARTHIS' as const,
      embedUri: '1',
      sourceUrl: 'https://hearthis.at/gone/missing-track/',
    };
    await expect(fetchEmbedThumbnail(input)).resolves.toBeNull();
    await expect(fetchEmbedThumbnail(input)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('hearthisApiUrl', () => {
  it('maps a track page to the API and rejects other pages', () => {
    expect(hearthisApiUrl('https://hearthis.at/dj/track')).toBe(
      'https://api-v2.hearthis.at/dj/track/',
    );
    expect(hearthisApiUrl('https://hearthis.at/dj/')).toBeNull();
    expect(hearthisApiUrl('https://evil.example/dj/track/')).toBeNull();
    expect(hearthisApiUrl('not a url')).toBeNull();
  });
});
