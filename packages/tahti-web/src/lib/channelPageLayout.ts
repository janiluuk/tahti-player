/** Composable blocks on the public channel page (owner design mode). */

export const CHANNEL_PAGE_ITEM_TYPES = [
  'hero',
  'actions',
  'archive',
  'chat',
  'about',
  'links',
  'textOverlay',
  'subscribe',
] as const;

export type ChannelPageItemType = (typeof CHANNEL_PAGE_ITEM_TYPES)[number];

export type ChannelPageItem = {
  id: string;
  type: ChannelPageItemType;
  visible: boolean;
};

export const CHANNEL_PAGE_ITEM_META: Record<
  ChannelPageItemType,
  { label: string; hint: string }
> = {
  hero: {
    label: 'Live stage',
    hint: 'Visualizer + now playing',
  },
  actions: {
    label: 'Tune-in actions',
    hint: 'Play, queue, favorite',
  },
  archive: {
    label: 'Archive',
    hint: 'Past sets table',
  },
  chat: {
    label: 'Chat',
    hint: 'Public live chat',
  },
  about: {
    label: 'About',
    hint: 'Bio and profile link',
  },
  links: {
    label: 'Links',
    hint: 'Social / outbound links',
  },
  textOverlay: {
    label: 'Text overlay',
    hint: 'Stylized headline on stage',
  },
  subscribe: {
    label: 'Subscribe CTA',
    hint: 'Fan membership pitch',
  },
};

export function defaultChannelPageLayout(): ChannelPageItem[] {
  return [
    { id: 'hero', type: 'hero', visible: true },
    { id: 'actions', type: 'actions', visible: true },
    { id: 'textOverlay', type: 'textOverlay', visible: false },
    { id: 'archive', type: 'archive', visible: true },
    { id: 'chat', type: 'chat', visible: true },
    { id: 'about', type: 'about', visible: true },
    { id: 'links', type: 'links', visible: false },
    { id: 'subscribe', type: 'subscribe', visible: true },
  ];
}

function storageKey(slug: string) {
  return `tahti.channelPageLayout.${slug}`;
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
  localStorage.setItem(storageKey(slug), JSON.stringify(normalizeLayout(items)));
}

export function normalizeLayout(items: ChannelPageItem[]): ChannelPageItem[] {
  const seenIds = new Set<string>();
  const seenTypes = new Set<ChannelPageItemType>();
  const out: ChannelPageItem[] = [];
  for (const item of items) {
    if (!CHANNEL_PAGE_ITEM_TYPES.includes(item.type)) {
      continue;
    }
    const id = item.id || item.type;
    if (seenIds.has(id) || seenTypes.has(item.type)) {
      continue;
    }
    seenIds.add(id);
    seenTypes.add(item.type);
    out.push({
      id,
      type: item.type,
      visible: Boolean(item.visible),
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

export function addItemType(
  items: ChannelPageItem[],
  type: ChannelPageItemType,
): ChannelPageItem[] {
  const existing = items.find((i) => i.type === type);
  if (existing) {
    return setItemVisible(items, existing.id, true);
  }
  return [
    ...items,
    {
      id: `${type}-${Date.now().toString(36)}`,
      type,
      visible: true,
    },
  ];
}
