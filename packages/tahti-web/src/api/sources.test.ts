import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  importHearthisTracks,
  importSoundcloudTracks,
  type HearthisTrack,
} from './sources';

const track: HearthisTrack = {
  id: 'hearthis-track',
  url: 'https://hearthis.at/artist/track/',
  title: 'Imported track',
  username: 'artist',
  durationSec: 180,
  coverUrl: 'https://images.hearthis.at/cover.jpg',
};

describe('importHearthisTracks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores source cover art on every imported archive item', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            soundId: 'archive-1',
            track: { coverUrl: track.coverUrl },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ url: '/stored-cover.jpg' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await importHearthisTracks('collection-1', [track]);

    expect(result).toEqual({
      imported: 1,
      failed: 0,
      artworkFailed: 0,
      items: [{ trackId: 'hearthis-track', soundId: 'archive-1' }],
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/tahti-api/api/me/sound/archive-1/banner/from-url',
      expect.objectContaining({
        body: JSON.stringify({ sourceUrl: track.coverUrl }),
        method: 'POST',
      }),
    );
  });
});

describe('importSoundcloudTracks', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('batches catalogs to stay within the API request limit', async () => {
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Response(JSON.stringify({ imports: [] }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const tracks = Array.from({ length: 21 }, (_, index) => ({
      trackId: `soundcloud-${index}`,
      title: `Track ${index}`,
    }));

    const result = await importSoundcloudTracks(tracks);

    expect(result).toEqual({ ok: true, count: 21 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).tracks).toHaveLength(
      20,
    );
    expect(JSON.parse(fetchMock.mock.calls[1]![1].body).tracks).toHaveLength(1);
  });
});
