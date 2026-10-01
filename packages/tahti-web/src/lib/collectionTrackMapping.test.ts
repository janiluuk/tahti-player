import { describe, expect, it } from 'vitest';

import { collectionItemToTrack } from './collectionTrackMapping';

describe('collectionItemToTrack', () => {
  it('names the track as usual', () => {
    expect(
      collectionItemToTrack({
        id: 'i1',
        position: 1,
        sound: { id: 's1', title: 'Night drive' },
      }).title,
    ).toBe('Night drive');
  });

  it('marks a track its artist has withdrawn', () => {
    expect(
      collectionItemToTrack({
        id: 'i2',
        position: 2,
        sound: { id: 's2', title: 'Their track' },
        unavailable: true,
      }).title,
    ).toBe('Their track (no longer available)');
  });

  it("credits the track's artist, falling back to You", () => {
    const theirs = collectionItemToTrack({
      id: 'i3',
      position: 3,
      sound: {
        id: 's3',
        title: 'Borrowed',
        artist: { username: 'selector', displayName: 'Selector' },
      },
    });
    expect(theirs.artists[0]?.name).toBe('Selector');
    const mine = collectionItemToTrack({
      id: 'i4',
      position: 4,
      sound: { id: 's4', title: 'Mine' },
    });
    expect(mine.artists[0]?.name).toBe('You');
  });
});
