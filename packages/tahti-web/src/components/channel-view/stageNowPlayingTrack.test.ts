import { describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../../api/types';
import { stageNowPlayingTrack } from './stageNowPlayingTrack';

function playable(overrides: Partial<TahtiPlayable>): TahtiPlayable {
  return {
    id: 'sound:1',
    kind: 'archive',
    title: 'Track',
    artist: 'Artist',
    ...overrides,
  } as TahtiPlayable;
}

describe('stageNowPlayingTrack', () => {
  it('finds the channel track by title, ignoring case and spacing', () => {
    const track = playable({ id: 'sound:a', title: 'All  the Pain' });
    expect(
      stageNowPlayingTrack({ title: ' all the pain ' }, [
        playable({ id: 'sound:b', title: 'Other' }),
        track,
      ]),
    ).toBe(track);
  });

  it('prefers a copy with peaks, then an embed, over a bare duplicate', () => {
    const bare = playable({ id: 'sound:bare', title: 'Mix' });
    const embed = playable({
      id: 'sound:embed',
      title: 'Mix',
      embed: { provider: 'hearthis', embedUri: 'https://hearthis.at/a/b/' },
    });
    const peaks = playable({ id: 'sound:peaks', title: 'Mix', peaks: [1, 2] });
    expect(stageNowPlayingTrack({ title: 'Mix' }, [bare, embed])).toBe(embed);
    expect(stageNowPlayingTrack({ title: 'Mix' }, [bare, embed, peaks])).toBe(
      peaks,
    );
  });

  it('returns null without a now-playing entry or a match', () => {
    expect(stageNowPlayingTrack(null, [playable({})])).toBeNull();
    expect(stageNowPlayingTrack({ title: 'Nope' }, [playable({})])).toBeNull();
    expect(stageNowPlayingTrack({ title: 'Track' }, undefined)).toBeNull();
  });
});
