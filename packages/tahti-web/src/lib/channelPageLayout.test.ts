import { describe, expect, it } from 'vitest';

import {
  addItemType,
  CHANNEL_PAGE_ITEM_TYPES,
  defaultChannelPageLayout,
  getLayoutPreset,
  moveItem,
  normalizeLayout,
  setItemOffset,
  setItemVisible,
  setItemWidth,
  setNavigationTabs,
  setPlaylistDisplay,
  setPlaylistSlug,
  type ChannelPageItem,
} from './channelPageLayout';

describe('defaultChannelPageLayout', () => {
  it('covers every known block type exactly once', () => {
    // Guards against the same drift the StudioNav submenu test catches:
    // adding a type to CHANNEL_PAGE_ITEM_TYPES without also registering it
    // here would leave normalizeLayout silently unable to restore it after
    // an older saved layout is loaded.
    const types = defaultChannelPageLayout().map((item) => item.type);
    expect(new Set(types)).toEqual(new Set(CHANNEL_PAGE_ITEM_TYPES));
    expect(types).toHaveLength(CHANNEL_PAGE_ITEM_TYPES.length);
  });
});

describe('normalizeLayout', () => {
  it('drops items with an unknown type', () => {
    const out = normalizeLayout([
      { id: 'x', type: 'not-a-real-type' as never, visible: true },
    ]);
    expect(out.some((item) => item.id === 'x')).toBe(false);
  });

  it('drops embed items missing an embedInstanceId', () => {
    const out = normalizeLayout([{ id: 'e1', type: 'embed', visible: true }]);
    expect(out.some((item) => item.id === 'e1')).toBe(false);
  });

  it('keeps a valid embed item', () => {
    const out = normalizeLayout([
      { id: 'e1', type: 'embed', visible: true, embedInstanceId: 'abc' },
    ]);
    expect(out.find((item) => item.id === 'e1')).toMatchObject({
      type: 'embed',
      embedInstanceId: 'abc',
    });
  });

  it('drops a duplicate id, keeping the first occurrence', () => {
    const out = normalizeLayout([
      { id: 'links', type: 'links', visible: true, width: 'wide' },
      { id: 'links', type: 'links', visible: false },
    ]);
    expect(out.filter((item) => item.id === 'links')).toHaveLength(1);
    expect(out.find((item) => item.id === 'links')).toMatchObject({
      visible: true,
      width: 'wide',
    });
  });

  it('drops a second non-embed item of a type already seen, even under a different id', () => {
    const out = normalizeLayout([
      { id: 'links', type: 'links', visible: true },
      { id: 'links-dupe', type: 'links', visible: true },
    ]);
    expect(out.filter((item) => item.type === 'links')).toHaveLength(1);
  });

  it('allows multiple embed items of the same type', () => {
    const out = normalizeLayout([
      { id: 'e1', type: 'embed', visible: true, embedInstanceId: 'a' },
      { id: 'e2', type: 'embed', visible: true, embedInstanceId: 'b' },
    ]);
    expect(out.filter((item) => item.type === 'embed')).toHaveLength(2);
  });

  it('drops playlist items missing a playlistSlug', () => {
    const out = normalizeLayout([
      { id: 'p1', type: 'playlist', visible: true },
    ]);
    expect(out.some((item) => item.id === 'p1')).toBe(false);
  });

  it('allows multiple playlist items', () => {
    const out = normalizeLayout([
      {
        id: 'p1',
        type: 'playlist',
        visible: true,
        playlistSlug: 'favorites-mix',
      },
      {
        id: 'p2',
        type: 'playlist',
        visible: true,
        playlistSlug: 'midnight-archive',
      },
    ]);
    expect(out.filter((item) => item.type === 'playlist')).toHaveLength(2);
  });

  it('keeps playlistDisplay when cards or tracklist', () => {
    const cards = normalizeLayout([
      {
        id: 'p1',
        type: 'playlist',
        visible: true,
        playlistSlug: 'favorites-mix',
        playlistDisplay: 'cards',
      },
    ]);
    expect(cards.find((item) => item.id === 'p1')?.playlistDisplay).toBe(
      'cards',
    );

    const tracklist = normalizeLayout([
      {
        id: 'p1',
        type: 'playlist',
        visible: true,
        playlistSlug: 'favorites-mix',
        playlistDisplay: 'tracklist',
      },
    ]);
    expect(tracklist.find((item) => item.id === 'p1')?.playlistDisplay).toBe(
      'tracklist',
    );

    const junk = normalizeLayout([
      {
        id: 'p1',
        type: 'playlist',
        visible: true,
        playlistSlug: 'favorites-mix',
        playlistDisplay: 'grid' as never,
      },
    ]);
    expect(
      junk.find((item) => item.id === 'p1')?.playlistDisplay,
    ).toBeUndefined();
  });

  it('drops legacy actions and textOverlay types', () => {
    const out = normalizeLayout([
      { id: 'actions', type: 'actions' as never, visible: true },
      { id: 'textOverlay', type: 'textOverlay' as never, visible: true },
      { id: 'hero', type: 'hero', visible: true },
    ]);
    expect(out.some((item) => item.id === 'actions')).toBe(false);
    expect(out.some((item) => item.id === 'textOverlay')).toBe(false);
  });

  it('fills in every missing type as a hidden default entry', () => {
    const out = normalizeLayout([{ id: 'hero', type: 'hero', visible: true }]);
    const remaining = CHANNEL_PAGE_ITEM_TYPES.filter((t) => t !== 'hero');
    for (const type of remaining) {
      const item = out.find((i) => i.type === type);
      expect(item).toBeDefined();
      expect(item?.visible).toBe(false);
    }
  });
});

describe('moveItem', () => {
  const items: ChannelPageItem[] = [
    { id: 'a', type: 'hero', visible: true },
    { id: 'b', type: 'archive', visible: true },
    { id: 'c', type: 'about', visible: true },
  ];

  it('reorders one item to another position', () => {
    const out = moveItem(items, 'a', 'c');
    expect(out.map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('is a no-op when fromId equals toId', () => {
    expect(moveItem(items, 'a', 'a')).toBe(items);
  });

  it('is a no-op when either id is missing', () => {
    expect(moveItem(items, 'missing', 'a')).toBe(items);
    expect(moveItem(items, 'a', 'missing')).toBe(items);
  });
});

describe('setItemVisible / setItemWidth / setItemOffset', () => {
  const items: ChannelPageItem[] = [
    { id: 'a', type: 'hero', visible: true },
    { id: 'b', type: 'archive', visible: false },
  ];

  it('setItemVisible only touches the matching id', () => {
    const out = setItemVisible(items, 'b', true);
    expect(out.find((i) => i.id === 'b')?.visible).toBe(true);
    expect(out.find((i) => i.id === 'a')?.visible).toBe(true);
  });

  it('setItemWidth sets and clears width', () => {
    const withWidth = setItemWidth(items, 'a', 'compact');
    expect(withWidth.find((i) => i.id === 'a')?.width).toBe('compact');
    const cleared = setItemWidth(withWidth, 'a', undefined);
    expect(cleared.find((i) => i.id === 'a')?.width).toBeUndefined();
  });

  it('setItemOffset only touches the matching id', () => {
    const out = setItemOffset(items, 'a', 32, -16);
    expect(out.find((i) => i.id === 'a')).toMatchObject({
      offsetX: 32,
      offsetY: -16,
    });
    expect(out.find((i) => i.id === 'b')?.offsetX).toBeUndefined();
  });
});

describe('setPlaylistSlug / setPlaylistDisplay', () => {
  const items: ChannelPageItem[] = [
    {
      id: 'p1',
      type: 'playlist',
      visible: true,
      playlistSlug: 'favorites-mix',
    },
    { id: 'hero', type: 'hero', visible: true },
  ];

  it('setPlaylistSlug only updates the matching playlist item', () => {
    const out = setPlaylistSlug(items, 'p1', 'midnight-archive');
    expect(out.find((item) => item.id === 'p1')?.playlistSlug).toBe(
      'midnight-archive',
    );
    expect(out.find((item) => item.id === 'hero')).toEqual(items[1]);
  });

  it('setPlaylistDisplay only updates the matching playlist item', () => {
    const out = setPlaylistDisplay(items, 'p1', 'cards');
    expect(out.find((item) => item.id === 'p1')?.playlistDisplay).toBe('cards');
    expect(out.find((item) => item.id === 'hero')).toEqual(items[1]);
  });
});

describe('addItemType', () => {
  it('appends a new, visible item for a type not yet present', () => {
    const out = addItemType(defaultChannelPageLayout(), 'chat');
    const added = out.find((i) => i.type === 'chat');
    expect(added?.visible).toBe(true);
  });

  it('reveals an existing (hidden) item instead of duplicating it', () => {
    const base = defaultChannelPageLayout();
    const before = base.filter((i) => i.type === 'links');
    expect(before).toHaveLength(1);
    expect(before[0].visible).toBe(false);

    const out = addItemType(base, 'links');
    expect(out.filter((i) => i.type === 'links')).toHaveLength(1);
    expect(out.find((i) => i.type === 'links')?.visible).toBe(true);
  });

  it('two rapid adds of the same type never produce two items', () => {
    // Mirrors how ChannelView now calls this from a functional setState
    // updater: each call must see the previous call's result, never a
    // stale snapshot, or a fast double-click could add the same block
    // twice with colliding ids.
    let layout = defaultChannelPageLayout();
    layout = addItemType(layout, 'stats');
    layout = addItemType(layout, 'stats');
    expect(layout.filter((i) => i.type === 'stats')).toHaveLength(1);
  });
});

describe('navigation tabs (opt-in tab bar)', () => {
  it('adding navigation seeds a single "Home" tab holding everything currently visible', () => {
    const base = defaultChannelPageLayout();
    const out = addItemType(base, 'navigation');
    const nav = out.find((i) => i.type === 'navigation');
    expect(nav?.visible).toBe(true);
    expect(nav?.navigationTabs).toHaveLength(1);
    expect(nav?.navigationTabs?.[0]?.label).toBe('Home');
    // Home starts holding every other block already visible by default
    // (hero/archive/about/subscribe) -- turning navigation on must not
    // change what a listener sees until a second tab exists.
    const heroId = base.find((i) => i.type === 'hero')?.id;
    expect(nav?.navigationTabs?.[0]?.itemIds).not.toContain(heroId);
    expect(nav?.navigationTabs?.[0]?.itemIds.length).toBeGreaterThan(0);
  });

  it('re-adding navigation after it was hidden reseeds tabs if it never had any', () => {
    // defaultChannelPageLayout carries navigation as a hidden stub with
    // no tabs -- addItemType's "existing" branch must still seed the
    // default Home tab, not just the "brand new item" branch.
    const base = defaultChannelPageLayout();
    expect(
      base.find((i) => i.type === 'navigation')?.navigationTabs,
    ).toBeUndefined();
    const out = addItemType(base, 'navigation');
    expect(
      out.find((i) => i.type === 'navigation')?.navigationTabs,
    ).toHaveLength(1);
  });

  it('does not reseed tabs the artist already configured', () => {
    let layout = addItemType(defaultChannelPageLayout(), 'navigation');
    const navId = layout.find((i) => i.type === 'navigation')!.id;
    layout = setNavigationTabs(layout, navId, [
      { id: 't1', label: 'Home', itemIds: [] },
      { id: 't2', label: 'Releases', itemIds: ['archive'] },
    ]);
    layout = setItemVisible(layout, navId, false);
    layout = addItemType(layout, 'navigation');
    const tabs = layout.find((i) => i.id === navId)?.navigationTabs;
    expect(tabs).toHaveLength(2);
    expect(tabs?.[1]?.label).toBe('Releases');
  });

  it('setNavigationTabs only updates the matching navigation item', () => {
    const layout = addItemType(defaultChannelPageLayout(), 'navigation');
    const navId = layout.find((i) => i.type === 'navigation')!.id;
    const out = setNavigationTabs(layout, navId, [
      { id: 't1', label: 'Home', itemIds: [] },
      { id: 't2', label: 'Releases', itemIds: ['archive'] },
    ]);
    expect(out.find((i) => i.id === navId)?.navigationTabs).toHaveLength(2);
    expect(out.find((i) => i.type === 'hero')).toEqual(
      layout.find((i) => i.type === 'hero'),
    );
  });

  it('normalizeLayout preserves well-shaped navigationTabs and drops malformed ones', () => {
    const out = normalizeLayout([
      { id: 'hero', type: 'hero', visible: true },
      {
        id: 'nav',
        type: 'navigation',
        visible: true,
        navigationTabs: [
          { id: 't1', label: 'Home', itemIds: ['hero'] },
          { bad: true } as never,
        ],
      },
    ]);
    const nav = out.find((i) => i.id === 'nav');
    expect(nav?.navigationTabs).toHaveLength(1);
    expect(nav?.navigationTabs?.[0]?.id).toBe('t1');
  });
});

describe('getLayoutPreset', () => {
  it('returns undefined for an unknown id', () => {
    expect(getLayoutPreset('not-a-preset')).toBeUndefined();
    expect(getLayoutPreset(null)).toBeUndefined();
    expect(getLayoutPreset(undefined)).toBeUndefined();
  });

  it('returns the matching preset for a known id', () => {
    expect(getLayoutPreset('stage')?.id).toBe('stage');
  });
});
