import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchLovedTracks } from './discover';

const entry = (soundId: string, loves: number, genre: string) => ({
  soundId,
  loves,
  title: `Track ${soundId}`,
  artistName: 'Aino',
  channelSlug: 'aino',
  bannerUrl: null,
  genre,
  contentType: 'TRACK',
});

describe('fetchLovedTracks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the ranking in one request per genre and merges by loves', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) => {
        const url = String(input);
        const body = url.includes('genre=Techno')
          ? { entries: [entry('a', 2, 'Techno'), entry('b', 1, 'Techno')] }
          : { entries: [entry('c', 5, 'House'), entry('a', 2, 'Techno')] };
        return new Response(JSON.stringify(body), { status: 200 });
      });

    const result = await fetchLovedTracks({
      genres: ['Techno', 'House'],
      contentTypes: ['DJ_SET'],
    });

    const urls = fetchSpy.mock.calls.map(([input]) => String(input));
    expect(urls).toHaveLength(2);
    expect(urls.every((url) => url.includes('/api/top-lists/loved?'))).toBe(
      true,
    );
    expect(urls.every((url) => url.includes('contentTypes=DJ_SET'))).toBe(true);
    expect(result.data.map((track) => [track.id, track.loves])).toEqual([
      ['sound:c', 5],
      ['sound:a', 2],
      ['sound:b', 1],
    ]);
    expect(result.data[0]).not.toHaveProperty('listens');
  });

  it('asks without a query when no filters are set', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ entries: [] }), { status: 200 }),
      );
    await fetchLovedTracks({ genres: [], contentTypes: [] });
    expect(String(fetchSpy.mock.calls[0]![0])).toMatch(
      /\/api\/top-lists\/loved$/,
    );
  });
});
