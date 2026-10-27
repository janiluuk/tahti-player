import { describe, expect, it } from 'vitest';

import type { PublicProfileTrack, TahtiPlayable } from '../../api/types';
import { profileTrackMeta } from './ArtistReferenceSections';

const PLAYABLE: TahtiPlayable = {
  id: 'sound:s1',
  kind: 'sound',
  title: 'Set',
  artist: 'Yaniho',
  streamUrl: 'https://example.com/s1.mp3',
  protocol: 'https',
};

const TRACK: PublicProfileTrack = {
  id: 's1',
  title: 'Set',
  playUrl: 'https://example.com/s1.mp3',
  genre: 'Techno',
  createdAt: '2026-10-03T12:00:00.000Z',
  likeCount: 2,
  playCount: 57,
  downloadCount: 4,
  downloadsEnabled: true,
};

describe('profileTrackMeta', () => {
  it('maps genre, totals and the download flag', () => {
    expect(profileTrackMeta([TRACK])(PLAYABLE)).toEqual({
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

  it('offers no download when the artist turned it off or the track is embed-only', () => {
    expect(
      profileTrackMeta([{ ...TRACK, downloadsEnabled: false }])(PLAYABLE)
        ?.downloadable,
    ).toBe(false);
    expect(
      profileTrackMeta([{ ...TRACK, playUrl: null }])(PLAYABLE)?.downloadable,
    ).toBe(false);
  });
});
