import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearEmbedThumbnailCache,
  clearEmbedThumbnailMemory,
  fetchEmbedThumbnail,
  fetchOembedThumbnail,
} from './embedThumbnail';

describe('fetchEmbedThumbnail', () => {
  afterEach(() => {
    clearEmbedThumbnailCache();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('asks the Tahti API proxy for a Spotify track id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        thumbnailUrl: 'https://cdn.example/spotify.jpg',
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
      `/tahti-api/api/v1/embeds/thumbnail?url=${encodeURIComponent(
        'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
      )}`,
      expect.anything(),
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('noembed');
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

  it('sends a hearthis page URL to the proxy when it is known', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        thumbnailUrl: 'https://img.hearthis.at/retina.jpg',
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
      `/tahti-api/api/v1/embeds/thumbnail?url=${encodeURIComponent(
        'https://hearthis.at/candana-dj/credo/',
      )}`,
      expect.anything(),
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
      json: async () => ({ thumbnailUrl: 'https://cdn.example/a.jpg' }),
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

  it('retries after the proxy rate-limits a lookup', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ thumbnailUrl: 'https://cdn.example/later.jpg' }),
      });
    vi.stubGlobal('fetch', fetchMock);
    const page = 'https://soundcloud.com/dj/limited';
    await expect(fetchOembedThumbnail(page)).resolves.toBeNull();
    await expect(fetchOembedThumbnail(page)).resolves.toBe(
      'https://cdn.example/later.jpg',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('answers a bundled cover without the network in mock mode', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      fetchOembedThumbnail('https://www.mixcloud.com/dj/mock-mix/'),
    ).resolves.toBe('/mock/dj-moonlight/cover-moonlight-drive.svg');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
