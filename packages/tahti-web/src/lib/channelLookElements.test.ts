import { beforeEach, describe, expect, it } from 'vitest';

import {
  channelLookElements,
  isArtistLookBlockId,
  isChannelLookElementId,
  loadArtistLookVisibility,
  parseArtistLookVisibility,
  resolveArtistLookVisibility,
  saveArtistLookVisibility,
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
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults every hideable block to visible', () => {
    expect(loadArtistLookVisibility('demo').player).toBe(true);
    expect(loadArtistLookVisibility('demo').bio).toBe(true);
    expect(loadArtistLookVisibility('demo').shows).toBe(true);
    expect(loadArtistLookVisibility('demo').gallery).toBe(true);
    expect(isArtistLookBlockId('backdrop')).toBe(false);
  });

  it('reads the channel value, dropping unknown and non-boolean entries', () => {
    const parsed = parseArtistLookVisibility(
      JSON.stringify({ bio: false, backdrop: false, gallery: 'no' }),
    );
    expect(parsed?.bio).toBe(false);
    expect(parsed?.gallery).toBe(true);
    expect(parsed).not.toHaveProperty('backdrop');
  });

  it.each([null, undefined, '', '[]', 'null', 'not json'])(
    'treats %p as no channel value',
    (json) => {
      expect(parseArtistLookVisibility(json)).toBeNull();
    },
  );

  it('prefers the channel value over this browser and defaults', () => {
    saveArtistLookVisibility('demo', {
      ...loadArtistLookVisibility('demo'),
      news: false,
    });
    const resolved = resolveArtistLookVisibility(
      'demo',
      JSON.stringify({ bio: false, gallery: false }),
    );
    expect(resolved.bio).toBe(false);
    expect(resolved.gallery).toBe(false);
    expect(resolved.news).toBe(true);
  });

  it('falls back to this browser, then to every block shown', () => {
    expect(resolveArtistLookVisibility('demo', null).news).toBe(true);
    saveArtistLookVisibility('demo', {
      ...loadArtistLookVisibility('demo'),
      news: false,
    });
    expect(resolveArtistLookVisibility('demo', null).news).toBe(false);
    expect(resolveArtistLookVisibility('other', undefined).news).toBe(true);
  });

  it('persists a hidden block and showing it again', () => {
    const visible = loadArtistLookVisibility('demo');
    saveArtistLookVisibility('demo', { ...visible, latest: false });
    expect(loadArtistLookVisibility('demo').latest).toBe(false);
    saveArtistLookVisibility('demo', { ...visible, latest: true });
    expect(loadArtistLookVisibility('demo').latest).toBe(true);
  });
});
