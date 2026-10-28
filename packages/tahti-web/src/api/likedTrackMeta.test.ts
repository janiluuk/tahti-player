import { describe, expect, it } from 'vitest';

import { likedTrackMeta, likedTrackToPlayable, type LikedTrack } from './likes';

const TRACK: LikedTrack = {
  id: 's1',
  title: 'Set',
  bannerUrl: null,
  audioUrl: 'https://example.com/s1.mp3',
  channelSlug: 'yaniho',
  artistUsername: 'yaniho',
  artistDisplayName: 'Yaniho',
  likedAt: '2026-10-20T10:00:00.000Z',
  url: '/channel/yaniho',
  durationSec: 2156,
  genre: 'Techno',
  peaks: [10, 120, 60],
  createdAt: '2026-10-03T12:00:00.000Z',
  downloadsEnabled: true,
  likeCount: 2,
  playCount: 57,
  downloadCount: 4,
};

describe('liked tracks as rows', () => {
  it('keeps the waveform, length and date on the playable', () => {
    expect(likedTrackToPlayable(TRACK)).toMatchObject({
      durationSec: 2156,
      peaks: [10, 120, 60],
      releaseDate: '2026-10-03T12:00:00.000Z',
    });
  });

  it('gives the row its genre, totals and download flag', () => {
    const playable = likedTrackToPlayable(TRACK)!;
    expect(likedTrackMeta(playable)).toEqual({
      genre: 'Techno',
      downloadable: true,
      stats: {
        releaseDate: '2026-10-03T12:00:00.000Z',
        likes: 2,
        plays: 57,
        downloads: 4,
      },
    });
  });

  it('knows nothing about playables it did not build', () => {
    expect(likedTrackMeta({ ...likedTrackToPlayable(TRACK)! })).toBeUndefined();
  });
});
