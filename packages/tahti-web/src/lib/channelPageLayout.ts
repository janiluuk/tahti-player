/** Composable blocks on the public channel page (owner design mode). */

export const CHANNEL_PAGE_ITEM_TYPES = [
  'hero',
  'sound',
  'chat',
  'about',
  'links',
  'subscribe',
  'stats',
  'events',
  'navigation',
] as const;

export type ChannelPageItemType = (typeof CHANNEL_PAGE_ITEM_TYPES)[number];

/** Multi-instance types (like embeds) — not auto-filled as hidden defaults. */
export type ChannelPageMultiItemType = 'embed' | 'playlist';

/** One tab of a `navigation` block: a label plus which other visible
 * layout items appear on the page while that tab is active. An item id
 * that isn't listed in any tab always shows, regardless of active tab —
 * so adding a new block after tabs exist doesn't silently hide it. */
export type ChannelNavigationTab = {
  id: string;
  label: string;
  itemIds: string[];
};

export type ChannelPageItem = {
  id: string;
  type: ChannelPageItemType | ChannelPageMultiItemType;
  visible: boolean;
  embedInstanceId?: string;
  /** Studio collection slug for `playlist` blocks. */
  playlistSlug?: string;
  /** How playlist tracks render on the channel page. */
  playlistDisplay?: 'tracklist' | 'cards';
  width?: 'full' | 'wide' | 'compact';
  offsetX?: number;
  offsetY?: number;
  /** `navigation` blocks only — off the page entirely until this exists
   * with 2+ tabs (opt-in: no tab bar shows by default). */
  navigationTabs?: ChannelNavigationTab[];
};

export const CHANNEL_PAGE_ITEM_META: Record<
  ChannelPageItem['type'],
  { label: string; hint: string }
> = {
  hero: {
    label: 'Live stage',
    hint: 'Visualizer + now playing',
  },
  sound: {
    label: 'Tracks',
    hint: 'Published channel tracks',
  },
  chat: {
    label: 'Chat',
    hint: 'Right-rail chat (no in-page panel)',
  },
  about: {
    label: 'About',
    hint: 'Bio and profile link',
  },
  links: {
    label: 'Links',
    hint: 'Social / outbound links',
  },
  subscribe: {
    label: 'Subscribe CTA',
    hint: 'Fan membership pitch',
  },
  stats: {
    label: 'Stats',
    hint: 'Follower count',
  },
  events: {
    label: 'Live shows',
    hint: 'Upcoming & past broadcasts',
  },
  navigation: {
    label: 'Navigation',
    hint: 'Section tabs under the player',
  },
  embed: {
    label: 'External embed',
    hint: 'Configured streaming player',
  },
  playlist: {
    label: 'Playlist',
    hint: 'Tracks from your library',
  },
};

export type ChannelLookBundle = {
  visualPreset: string;
  headerStyle: string;
  brandAccentPreset: string;
  colorScheme: {
    accent: string;
    highlight: string;
    bg: string;
    text: string;
    muted?: string;
  };
};

export type ChannelLayoutPresetId = 'subtle' | 'stage' | 'full' | 'tahti';

export type ChannelLayoutPreset = {
  id: ChannelLayoutPresetId;
  name: string;
  description: string;
  items: ChannelPageItem[];
  look: ChannelLookBundle;
};

function item(
  type: ChannelPageItemType,
  visible: boolean,
): {
  id: string;
  type: ChannelPageItemType;
  visible: boolean;
} {
  return { id: type, type, visible };
}

/** Named one-click page layouts (order + visibility + matching look). */
export const CHANNEL_LAYOUT_PRESETS: ChannelLayoutPreset[] = [
  {
    id: 'subtle',
    name: 'Subtle / Solid',
    description: 'Minimal solid page.',
    items: [
      item('hero', true),
      item('about', true),
      item('sound', true),
      item('subscribe', false),
      item('chat', false),
      item('links', false),
      item('stats', false),
    ],
    look: {
      visualPreset: 'MINIMAL',
      headerStyle: 'SOLID',
      brandAccentPreset: 'noir',
      colorScheme: {
        accent: '#94A3B8',
        highlight: '#CBD5E1',
        bg: '#0B0F14',
        text: '#E8EEF5',
        muted: '#64748B',
      },
    },
  },
  {
    id: 'stage',
    name: 'Stage / Live',
    description: 'Live stage forward.',
    items: [
      item('hero', true),
      item('subscribe', true),
      item('sound', true),
      item('about', true),
      item('chat', false),
      item('links', false),
      item('stats', false),
    ],
    look: {
      visualPreset: 'AURORA',
      headerStyle: 'GRADIENT',
      brandAccentPreset: 'aurora',
      colorScheme: {
        accent: '#22D3EE',
        highlight: '#A78BFA',
        bg: '#0B1220',
        text: '#F8FAFC',
        muted: '#64748B',
      },
    },
  },
  {
    id: 'full',
    name: 'Archive-first',
    description: 'Catalog up front.',
    items: [
      item('sound', true),
      item('hero', true),
      item('about', true),
      item('subscribe', true),
      item('links', true),
      item('chat', false),
      item('stats', true),
    ],
    look: {
      visualPreset: 'WAVEFORM_BARS',
      headerStyle: 'GRADIENT',
      brandAccentPreset: 'ember',
      colorScheme: {
        accent: '#F97316',
        highlight: '#FBBF24',
        bg: '#120B08',
        text: '#FFF7ED',
        muted: '#9A3412',
      },
    },
  },
  {
    id: 'tahti',
    name: 'Tahti / On Air',
    description: 'On-air Tahti look.',
    items: [
      item('hero', true),
      item('subscribe', true),
      item('sound', true),
      item('about', true),
      item('links', false),
      item('chat', false),
      item('stats', false),
    ],
    look: {
      visualPreset: 'WAVEFORM_BARS',
      headerStyle: 'SOLID',
      brandAccentPreset: 'tahti',
      colorScheme: {
        accent: '#FFB020',
        highlight: '#35D6C4',
        bg: '#0A0E1A',
        text: '#F5F7FC',
        muted: '#64748B',
      },
    },
  },
];

export function getLayoutPreset(
  id: string | null | undefined,
): ChannelLayoutPreset | undefined {
  return CHANNEL_LAYOUT_PRESETS.find((p) => p.id === id);
}

export function defaultChannelPageLayout(): Array<{
  id: string;
  type: ChannelPageItemType;
  visible: boolean;
}> {
  return [
    item('hero', true),
    item('sound', true),
    item('about', true),
    item('links', false),
    item('subscribe', true),
    item('stats', false),
    item('events', false),
    item('chat', false),
    item('navigation', false),
  ];
}

function storageKey(slug: string) {
  return `tahti.channelPageLayout.${slug}`;
}

function presetStorageKey(slug: string) {
  return `tahti.channelPageLayoutPreset.${slug}`;
}

export function loadChannelPageLayout(slug: string): ChannelPageItem[] {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) {
      return defaultChannelPageLayout();
    }
    const parsed = JSON.parse(raw) as ChannelPageItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultChannelPageLayout();
    }
    return normalizeLayout(parsed);
  } catch {
    return defaultChannelPageLayout();
  }
}

export function saveChannelPageLayout(
  slug: string,
  items: ChannelPageItem[],
): void {
  localStorage.setItem(
    storageKey(slug),
    JSON.stringify(normalizeLayout(items)),
  );
}

export function loadChannelLayoutPresetId(
  slug: string,
): ChannelLayoutPresetId | null {
  try {
    const raw = localStorage.getItem(presetStorageKey(slug));
    if (
      raw === 'subtle' ||
      raw === 'stage' ||
      raw === 'full' ||
      raw === 'tahti'
    ) {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveChannelLayoutPresetId(
  slug: string,
  id: ChannelLayoutPresetId | null,
): void {
  if (!id) {
    localStorage.removeItem(presetStorageKey(slug));
    return;
  }
  localStorage.setItem(presetStorageKey(slug), id);
}

function isMultiItemType(
  type: ChannelPageItem['type'],
): type is ChannelPageMultiItemType {
  return type === 'embed' || type === 'playlist';
}

export function normalizeLayout(items: ChannelPageItem[]): ChannelPageItem[] {
  const seenIds = new Set<string>();
  const seenTypes = new Set<ChannelPageItemType>();
  const out: ChannelPageItem[] = [];
  for (const layoutItem of items) {
    const isKnownSingleton = CHANNEL_PAGE_ITEM_TYPES.includes(
      layoutItem.type as ChannelPageItemType,
    );
    const isMulti = isMultiItemType(layoutItem.type);
    if (!isKnownSingleton && !isMulti) {
      continue;
    }
    if (layoutItem.type === 'embed' && !layoutItem.embedInstanceId) {
      continue;
    }
    if (layoutItem.type === 'playlist' && !layoutItem.playlistSlug) {
      continue;
    }
    const id = layoutItem.id || layoutItem.type;
    if (seenIds.has(id)) {
      continue;
    }
    if (!isMulti && seenTypes.has(layoutItem.type as ChannelPageItemType)) {
      continue;
    }
    seenIds.add(id);
    if (!isMulti) {
      seenTypes.add(layoutItem.type as ChannelPageItemType);
    }
    out.push({
      id,
      type: layoutItem.type,
      visible: Boolean(layoutItem.visible),
      ...(layoutItem.type === 'embed'
        ? { embedInstanceId: layoutItem.embedInstanceId }
        : {}),
      ...(layoutItem.type === 'playlist'
        ? {
            playlistSlug: layoutItem.playlistSlug,
            ...(layoutItem.playlistDisplay === 'cards' ||
            layoutItem.playlistDisplay === 'tracklist'
              ? { playlistDisplay: layoutItem.playlistDisplay }
              : {}),
          }
        : {}),
      ...(layoutItem.type === 'navigation' &&
      Array.isArray(layoutItem.navigationTabs)
        ? {
            navigationTabs: layoutItem.navigationTabs.filter(
              (tab): tab is ChannelNavigationTab =>
                typeof tab?.id === 'string' &&
                typeof tab?.label === 'string' &&
                Array.isArray(tab?.itemIds),
            ),
          }
        : {}),
      ...(layoutItem.width ? { width: layoutItem.width } : {}),
      ...(layoutItem.offsetX !== undefined
        ? { offsetX: layoutItem.offsetX }
        : {}),
      ...(layoutItem.offsetY !== undefined
        ? { offsetY: layoutItem.offsetY }
        : {}),
    });
  }
  for (const def of defaultChannelPageLayout()) {
    if (!seenTypes.has(def.type)) {
      out.push({ ...def, visible: false });
    }
  }
  return out;
}

export function moveItem(
  items: ChannelPageItem[],
  fromId: string,
  toId: string,
): ChannelPageItem[] {
  if (fromId === toId) {
    return items;
  }
  const next = [...items];
  const from = next.findIndex((i) => i.id === fromId);
  const to = next.findIndex((i) => i.id === toId);
  if (from < 0 || to < 0) {
    return items;
  }
  const [row] = next.splice(from, 1);
  if (!row) {
    return items;
  }
  next.splice(to, 0, row);
  return next;
}

export function setItemVisible(
  items: ChannelPageItem[],
  id: string,
  visible: boolean,
): ChannelPageItem[] {
  return items.map((i) => (i.id === id ? { ...i, visible } : i));
}

export function setItemWidth(
  items: ChannelPageItem[],
  id: string,
  width: ChannelPageItem['width'],
): ChannelPageItem[] {
  return items.map((item) =>
    item.id === id
      ? { ...item, ...(width ? { width } : { width: undefined }) }
      : item,
  );
}

export function setItemOffset(
  items: ChannelPageItem[],
  id: string,
  offsetX: number,
  offsetY: number,
): ChannelPageItem[] {
  return items.map((item) =>
    item.id === id ? { ...item, offsetX, offsetY } : item,
  );
}

export function setPlaylistSlug(
  items: ChannelPageItem[],
  id: string,
  playlistSlug: string,
): ChannelPageItem[] {
  return items.map((item) =>
    item.id === id && item.type === 'playlist'
      ? { ...item, playlistSlug }
      : item,
  );
}

export function setPlaylistDisplay(
  items: ChannelPageItem[],
  id: string,
  playlistDisplay: 'tracklist' | 'cards',
): ChannelPageItem[] {
  return items.map((item) =>
    item.id === id && item.type === 'playlist'
      ? { ...item, playlistDisplay }
      : item,
  );
}

/** A single "Home" tab holding everything already on the page -- one tab
 * means the bar stays hidden (nothing to switch between), so turning
 * navigation on changes nothing until a second tab is added and some
 * items are moved into it. */
function defaultNavigationTabs(
  items: ChannelPageItem[],
): ChannelNavigationTab[] {
  return [
    {
      id: `tab-${Date.now().toString(36)}`,
      label: 'Home',
      itemIds: items
        .filter(
          (i) =>
            i.visible &&
            i.type !== 'hero' &&
            i.type !== 'chat' &&
            i.type !== 'navigation',
        )
        .map((i) => i.id),
    },
  ];
}

export function addItemType(
  items: ChannelPageItem[],
  type: ChannelPageItemType,
): ChannelPageItem[] {
  const existing = items.find((i) => i.type === type);
  if (existing) {
    const next = setItemVisible(items, existing.id, true);
    // A pre-existing entry can be the hidden default stub every layout
    // carries for `navigation` (see defaultChannelPageLayout) -- that
    // stub has no tabs yet, so seed them here too, not just on brand-new
    // items below.
    if (type === 'navigation' && !existing.navigationTabs?.length) {
      return setNavigationTabs(next, existing.id, defaultNavigationTabs(items));
    }
    return next;
  }
  const newItem: ChannelPageItem = {
    id: `${type}-${Date.now().toString(36)}`,
    type,
    visible: true,
    ...(type === 'navigation'
      ? { navigationTabs: defaultNavigationTabs(items) }
      : {}),
  };
  return [...items, newItem];
}

export function setNavigationTabs(
  items: ChannelPageItem[],
  id: string,
  navigationTabs: ChannelNavigationTab[],
): ChannelPageItem[] {
  return items.map((item) =>
    item.id === id && item.type === 'navigation'
      ? { ...item, navigationTabs }
      : item,
  );
}

export function addPlaylistItem(
  items: ChannelPageItem[],
  playlistSlug: string,
): ChannelPageItem[] {
  const existing = items.find(
    (item) => item.type === 'playlist' && item.playlistSlug === playlistSlug,
  );
  if (existing) {
    return setItemVisible(items, existing.id, true);
  }
  return [
    ...items,
    {
      id: `playlist-${playlistSlug}-${Date.now().toString(36)}`,
      type: 'playlist',
      playlistSlug,
      visible: true,
    },
  ];
}
