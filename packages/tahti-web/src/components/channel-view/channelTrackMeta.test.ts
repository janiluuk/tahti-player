import { describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../../api/types';
import { channelTrackMeta } from './channelTrackMeta';

const PLAYABLE: TahtiPlayable = {
  id: 'sound:s1',
  kind: 'sound',
  title: 'Moody Electronica vol. 40',
  artist: 'Yaniho',
  streamUrl: 'https://example.com/s1.mp3',
  protocol: 'https',
};

describe('channelTrackMeta', () => {
  it('maps a channel item to its genre and public totals', () => {
    const meta = channelTrackMeta([
      {
        id: 's1',
        title: 'Moody Electronica vol. 40',
        genre: 'Progressive House',
        createdAt: '2026-10-17T12:00:00.000Z',
        likeCount: 3,
        playCount: 31,
        downloadCount: 15,
      },
    ]);
    expect(meta(PLAYABLE)).toEqual({
      genre: 'Progressive House',
      stats: {
        releaseDate: '2026-10-17T12:00:00.000Z',
        likes: 3,
        plays: 31,
        downloads: 15,
      },
    });
  });

  it('returns nothing for a track it does not know', () => {
    expect(channelTrackMeta([])(PLAYABLE)).toBeUndefined();
  });
});
