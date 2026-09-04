import { describe, expect, it } from 'vitest';

import { archiveItemToPlayable } from './mock';
import type { ArchiveItem } from './types';

function baseItem(overrides: Partial<ArchiveItem> = {}): ArchiveItem {
  return {
    id: 'item-1',
    title: 'Test track',
    artistName: 'Test artist',
    ...overrides,
  };
}

describe('archiveItemToPlayable', () => {
  it('builds a normal streaming playable when audioUrl is set', () => {
    const playable = archiveItemToPlayable(
      baseItem({ audioUrl: 'https://cdn.example/track.mp3' }),
      'my-channel',
    );
    expect(playable).toMatchObject({
      id: 'archive:item-1',
      streamUrl: 'https://cdn.example/track.mp3',
      protocol: 'https',
    });
    expect(playable?.embed).toBeUndefined();
  });

  it('builds an embed-aware playable for a hearthis.at EMBED_ONLY item with no audioUrl', () => {
    const playable = archiveItemToPlayable(
      baseItem({
        audioUrl: null,
        embedProvider: 'HEARTHIS',
        embedUri: '123456',
      }),
      'my-channel',
    );
    expect(playable).not.toBeNull();
    expect(playable?.embed).toEqual({
      provider: 'hearthis',
      embedUri: '123456',
    });
    expect(playable?.sourceProvider).toBe('hearthis');
    expect(playable?.streamUrl).toBe('');
  });

  it('returns null for a non-hearthis embed provider with no audioUrl (no inline widget here)', () => {
    const playable = archiveItemToPlayable(
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
    const playable = archiveItemToPlayable(baseItem({ audioUrl: null }));
    expect(playable).toBeNull();
  });
});
