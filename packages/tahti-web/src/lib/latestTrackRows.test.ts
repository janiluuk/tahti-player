import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchLatestTracks } from '../api/discover';
import { discoverTrackPlayable } from './discoverTrackPlayable';

describe('latest tracks for Listen rows', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps genre, waveform, date and totals through to the playable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [
              {
                soundId: 's1',
                title: 'Set',
                artistName: 'Yaniho',
                artistUsername: 'yaniho',
                channelSlug: 'yaniho',
                bannerUrl: null,
                durationSec: 2156,
                audioUrl: 'https://example.com/s1.mp3',
                genre: 'Progressive House',
                peaks: [10, 200, 90],
                createdAt: '2026-10-03T12:00:00.000Z',
                downloadsEnabled: true,
                likeCount: 2,
                playCount: 57,
                downloadCount: 4,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    const { data } = await fetchLatestTracks({ genres: [], contentTypes: [] });
    expect(data[0]).toMatchObject({
      genre: 'Progressive House',
      likeCount: 2,
      playCount: 57,
      downloadCount: 4,
      downloadsEnabled: true,
    });
    expect(discoverTrackPlayable(data[0]!)).toMatchObject({
      peaks: [10, 200, 90],
      releaseDate: '2026-10-03T12:00:00.000Z',
    });
  });
});
