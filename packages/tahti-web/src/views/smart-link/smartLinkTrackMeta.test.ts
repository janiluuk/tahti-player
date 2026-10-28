import { describe, expect, it } from 'vitest';

import type { SmartLinkView } from '../../api/smart-link-types';
import { smartLinkPlayables, smartLinkTrackMeta } from './smartLinkTracks';

const DATA = {
  release: {
    id: 'r1',
    title: 'First Light',
    releaseDate: '2026-10-03',
    artworkUrl: null,
    tracks: [
      {
        id: 't1',
        soundId: 's1',
        title: 'Polar Night',
        position: 1,
        durationSec: 244,
        audioUrl: 'https://example.com/s1.mp3',
        genre: 'Ambient',
        peaks: [20, 140, 60],
        likeCount: 2,
        playCount: 57,
        downloadCount: 4,
      },
      {
        id: 't2',
        soundId: null,
        title: 'Unlinked',
        position: 2,
        audioUrl: 'https://example.com/t2.mp3',
      },
    ],
  },
  artist: { username: 'aurora', displayName: 'Aurora Drift', avatarUrl: null },
} as unknown as SmartLinkView;

describe('smart link rows', () => {
  it('keeps the waveform on linked tracks', () => {
    expect(smartLinkPlayables(DATA)[0]).toMatchObject({ peaks: [20, 140, 60] });
  });

  it('gives linked tracks their genre and totals, and unlinked ones nothing', () => {
    const [linked, unlinked] = smartLinkPlayables(DATA);
    const meta = smartLinkTrackMeta(DATA);
    expect(meta(linked!)).toEqual({
      genre: 'Ambient',
      stats: {
        releaseDate: '2026-10-03',
        likes: 2,
        plays: 57,
        downloads: 4,
      },
    });
    expect(meta(unlinked!)).toBeUndefined();
  });
});
