import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearEmbedThumbnailCache,
  clearEmbedThumbnailMemory,
  fetchEmbedThumbnail,
  hearthisApiUrl,
} from './embedThumbnail';

describe('fetchEmbedThumbnail', () => {
  afterEach(() => {
    clearEmbedThumbnailCache();
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

  it('keeps a failed lookup in session storage', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal('fetch', fetchMock);
    const input = {
      provider: 'SPOTIFY' as const,
      embedUri: 'cached-miss',
    };
    await fetchEmbedThumbnail(input);
    clearEmbedThumbnailMemory();
    await fetchEmbedThumbnail(input);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('looks up at most three covers at once', async () => {
    const resolvers: Array<(value: unknown) => void> = [];
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const pending = Promise.all(
      ['a', 'b', 'c', 'd', 'e'].map((id) =>
        fetchEmbedThumbnail({ provider: 'SPOTIFY', embedUri: id }),
      ),
    );
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const ok = () => ({
      ok: true,
      json: async () => ({ thumbnail_url: 'https://cdn.example/a.jpg' }),
    });
    resolvers.shift()?.(ok());
    for (let i = 0; i < 8; i += 1) {
      await Promise.resolve();
    }
    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (let guard = 0; guard < 8; guard += 1) {
      const batch = resolvers.splice(0);
      if (batch.length === 0) {
        break;
      }
      batch.forEach((resolve) => resolve(ok()));
      for (let i = 0; i < 8; i += 1) {
        await Promise.resolve();
      }
    }
    await pending;
    expect(fetchMock).toHaveBeenCalledTimes(5);
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
