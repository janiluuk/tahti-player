import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  adjacentLookElementId,
  channelLookElements,
  isArtistLookBlockId,
  isChannelLookElementId,
  loadArtistLookVisibility,
  saveArtistLookVisibility,
  toggleArtistLookVisibility,
} from './channelLookElements';
import { CHANNEL_PAGE_ITEM_TYPES } from './channelPageLayout';
import { webT } from './webT';

describe('CHANNEL_LOOK_ELEMENTS', () => {
  it('lists the usable artist-page blocks', () => {
    const ids = channelLookElements(webT()).map((element) => element.id);
    expect(ids).toEqual([
      'releases',
      'tracks',
      'latest',
      'feed',
      'news',
      'player',
      'bio',
      'shows',
      'gallery',
      'backdrop',
    ]);
    expect(ids).not.toContain('header');
    expect(ids).not.toContain('actions');
    expect(ids).not.toContain('chat');
    expect(ids).not.toContain('textOverlay');
  });

  it('maps disable-able rows with a layout type onto real layout types', () => {
    const layoutTypes = channelLookElements(webT())
      .filter((element) => element.canDisable && element.layoutType)
      .map((element) => element.layoutType);
    for (const type of layoutTypes) {
      expect(type).not.toBeNull();
      expect(CHANNEL_PAGE_ITEM_TYPES).toContain(type);
    }
  });
});

describe('adjacentLookElementId', () => {
  it('wraps from the last element to the first', () => {
    expect(adjacentLookElementId('backdrop', 1)).toBe('releases');
  });

  it('wraps from the first element to the last', () => {
    expect(adjacentLookElementId('releases', -1)).toBe('backdrop');
  });

  it('steps to the next listed element', () => {
    expect(adjacentLookElementId('releases', 1)).toBe('tracks');
    expect(adjacentLookElementId('player', -1)).toBe('news');
  });

  it('falls back to the start of the list for an unknown id', () => {
    expect(adjacentLookElementId('not-a-section', 1)).toBe('tracks');
  });
});

describe('isChannelLookElementId', () => {
  it('accepts listed ids only', () => {
    expect(isChannelLookElementId('player')).toBe(true);
    expect(isChannelLookElementId('backdrop')).toBe(true);
    expect(isChannelLookElementId('header')).toBe(false);
    expect(isChannelLookElementId('text-overlay')).toBe(false);
    expect(isChannelLookElementId(null)).toBe(false);
  });
});

describe('artist look visibility', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => {
          memory.set(key, value);
        },
        removeItem: (key: string) => {
          memory.delete(key);
        },
      },
    });
  });

  afterEach(() => {
    memory.clear();
  });

  it('defaults every hideable block to visible', () => {
    expect(loadArtistLookVisibility('demo').player).toBe(true);
    expect(loadArtistLookVisibility('demo').bio).toBe(true);
    expect(loadArtistLookVisibility('demo').shows).toBe(true);
    expect(loadArtistLookVisibility('demo').gallery).toBe(true);
    expect(isArtistLookBlockId('backdrop')).toBe(false);
  });

  it('toggles and persists a hideable block', () => {
    const hidden = toggleArtistLookVisibility('demo', 'latest');
    expect(hidden.latest).toBe(false);
    expect(loadArtistLookVisibility('demo').latest).toBe(false);
    saveArtistLookVisibility('demo', { ...hidden, latest: true });
    expect(loadArtistLookVisibility('demo').latest).toBe(true);
  });
});
