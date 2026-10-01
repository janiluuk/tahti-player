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
});
