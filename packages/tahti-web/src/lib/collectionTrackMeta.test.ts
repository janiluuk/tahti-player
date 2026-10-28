import { describe, expect, it } from 'vitest';

import type { PublicCollection, TahtiPlayable } from '../api/types';
import { collectionTrackMeta } from './collectionTrackMeta';

const COLLECTION = {
  slug: 'mix',
  name: 'Mix',
  user: { username: 'yaniho', displayName: 'Yaniho' },
  links: { page: '', rss: '' },
  items: [
    {
      position: 1,
      release: null,
      sound: {
        id: 's1',
        title: 'Set',
        audioUrl: 'https://example.com/s1.mp3',
        genre: 'Techno',
        createdAt: '2026-10-03T12:00:00.000Z',
        downloadsEnabled: true,
        likeCount: 2,
        playCount: 57,
        downloadCount: 4,
        commentCount: 6,
      },
    },
  ],
} as unknown as PublicCollection;

const PLAYABLE = { id: 'sound:s1' } as TahtiPlayable;

describe('collectionTrackMeta', () => {
  it('maps a collection track to its genre, totals and download flag', () => {
    expect(collectionTrackMeta(COLLECTION)(PLAYABLE)).toEqual({
      genre: 'Techno',
      downloadable: true,
      stats: {
        releaseDate: '2026-10-03T12:00:00.000Z',
        likes: 2,
        plays: 57,
        downloads: 4,
        comments: 6,
      },
    });
  });

  it('knows nothing about tracks outside the collection', () => {
    expect(
      collectionTrackMeta(COLLECTION)({ id: 'sound:other' } as TahtiPlayable),
    ).toBeUndefined();
  });
});
