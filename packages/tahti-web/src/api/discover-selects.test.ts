import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchTahtiSelects } from './discover';

describe('fetchTahtiSelects', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps the curated rotation into Discover track rows', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              soundId: 's1',
              title: 'Northern Lights',
              artistName: 'Aino',
              artistUsername: 'aino',
              channelSlug: 'aino',
              bannerUrl: 'https://cdn.example/s1.jpg',
              durationSec: 240,
              audioUrl: 'https://cdn.example/s1.mp3',
              gate: null,
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const result = await fetchTahtiSelects();
    expect(String(fetchSpy.mock.calls[0]![0])).toContain(
      '/api/v1/tahti-selects/gallery',
    );
    expect(result.data).toEqual([
      {
        id: 'sound:s1',
        title: 'Northern Lights',
        artist: 'Aino',
        artistUsername: 'aino',
        channelSlug: 'aino',
        coverUrl: 'https://cdn.example/s1.jpg',
        durationSec: 240,
        audioUrl: 'https://cdn.example/s1.mp3',
      },
    ]);
  });

  it('keeps the server waveform peaks on each row', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              soundId: 's1',
              title: 'Northern Lights',
              artistName: 'Aino',
              artistUsername: 'aino',
              channelSlug: 'aino',
              bannerUrl: null,
              durationSec: 240,
              audioUrl: 'https://cdn.example/s1.mp3',
              gate: null,
              peaks: [5, 220, 70],
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const result = await fetchTahtiSelects();
    expect(result.data[0]?.peaks).toEqual([5, 220, 70]);
  });

  it('returns no rows when the gallery cannot be read', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 500 }),
    );
    await expect(fetchTahtiSelects()).resolves.toMatchObject({ data: [] });
  });
});
