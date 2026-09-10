import { describe, expect, it } from 'vitest';

import { soundItemToPlayable } from './mock';
import type { ChannelSoundItem } from './types';

function baseItem(overrides: Partial<ChannelSoundItem> = {}): ChannelSoundItem {
  return {
    id: 'item-1',
    title: 'Test track',
    artistName: 'Test artist',
    ...overrides,
  };
}

describe('soundItemToPlayable', () => {
  it('builds a normal streaming playable when audioUrl is set', () => {
    const playable = soundItemToPlayable(
      baseItem({ audioUrl: 'https://cdn.example/track.mp3' }),
      'my-channel',
    );
    expect(playable).toMatchObject({
      id: 'sound:item-1',
      streamUrl: 'https://cdn.example/track.mp3',
      protocol: 'https',
    });
    expect(playable?.embed).toBeUndefined();
  });

  it('builds an embed-aware playable for a hearthis.at EMBED_ONLY item with no audioUrl', () => {
    const playable = soundItemToPlayable(
      baseItem({
        audioUrl: null,
        embedProvider: 'HEARTHIS',
        embedUri: '123456',
      }),
      'my-channel',
    );
    expect(playable).not.toBeNull();
    expect(playable).toMatchObject({
      sourceProvider: 'hearthis',
      streamUrl: '',
      embed: {
        provider: 'hearthis',
        embedUri: '123456',
      },
    });
  });

  it('returns null for a non-hearthis embed provider with no audioUrl (no inline widget here)', () => {
    const playable = soundItemToPlayable(
      baseItem({
        audioUrl: null,
        embedProvider: 'BANDCAMP',
        embedUri: 'abc',
      }),
      'my-channel',
    );
    expect(playable).toBeNull();
  });

  it('returns null when there is neither audioUrl nor embed data', () => {
    const playable = soundItemToPlayable(baseItem({ audioUrl: null }));
    expect(playable).toBeNull();
  });
});
