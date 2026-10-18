import { describe, expect, it } from 'vitest';

import {
  MOCK_GATED_PURCHASE_TRACK_ID,
  MOCK_GATED_SUBSCRIBERS_TRACK_ID,
  mockSearch,
  mockSmartLink,
  mockTrackDetail,
  soundItemToPlayable,
} from './mock';
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

describe('mockSmartLink', () => {
  it('returns the release the slug names', () => {
    expect(mockSmartLink('northern-lights-release-1').release.title).toBe(
      'First Light EP',
    );
    expect(mockSmartLink('northern-lights-release-2').release.title).toBe(
      'Polar Static',
    );
  });
});

describe('mockSearch', () => {
  it('returns Favorites vault collection hits', () => {
    const { collections } = mockSearch('vault');
    expect(collections.length).toBeGreaterThan(0);
    expect(collections.some((c) => c.name === 'Favorites vault')).toBe(true);
    expect(
      collections.some(
        (c) =>
          c.slug === 'favorites-vault' && c.ownerUsername === 'northern-lights',
      ),
    ).toBe(true);
  });
});

describe('mockTrackDetail', () => {
  it('includes fan-subscriber and purchase gate fixtures', () => {
    expect(mockTrackDetail(MOCK_GATED_SUBSCRIBERS_TRACK_ID)).toMatchObject({
      accessMode: 'SUBSCRIBERS_ONLY',
      title: expect.stringContaining('Fan subscribers'),
    });
    expect(mockTrackDetail(MOCK_GATED_PURCHASE_TRACK_ID)).toMatchObject({
      accessMode: 'PURCHASE',
      purchaseTierName: 'Single unlock (demo)',
      purchaseTierPriceCents: 300,
    });
  });
});
