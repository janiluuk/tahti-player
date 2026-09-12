import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavigationStructureItem = {
  id: string;
  label: string;
  path: string;
  children?: NavigationStructureItem[];
};

type NavigationStructureState = {
  items: NavigationStructureItem[];
  addItem: (label: string, path: string, parentId?: string) => void;
  removeItem: (id: string) => void;
  moveItem: (id: string, direction: -1 | 1) => void;
};

// Mirrors the real app's current nested navigation (see AppShell.tsx's
// sidebar top level and StudioNav.tsx's SUBMENUS/AUDIENCE_SUBNAV_ITEMS/
// BROADCAST_SUBNAV_ITEMS) so the draft widget starts by showing the whole
// real tree, not just its top level.
const DEFAULT_ITEMS: NavigationStructureItem[] = [
  { id: 'listen', label: 'Listen', path: '/' },
  { id: 'radio', label: 'Radio', path: '/radio' },
  { id: 'discover', label: 'Discover', path: '/discover' },
  { id: 'favorites', label: 'Favorites', path: '/favorites' },
  { id: 'library', label: 'Library', path: '/library' },
  {
    id: 'studio',
    label: 'Studio',
    path: '/studio',
    children: [
      { id: 'studio-overview', label: 'Overview', path: '/studio' },
      { id: 'studio-branding', label: 'Branding', path: '/studio/branding' },
      { id: 'studio-stats', label: 'Stats', path: '/studio/stats' },
      {
        id: 'studio-governance',
        label: 'Governance',
        path: '/studio/governance',
      },
      { id: 'studio-posts', label: 'Posts', path: '/studio/updates' },
      {
        id: 'studio-audience',
        label: 'Audience',
        path: '/studio/audience',
        children: [
          {
            id: 'studio-audience-overview',
            label: 'Overview',
            path: '/studio/audience',
          },
          {
            id: 'studio-audience-tiers',
            label: 'Tiers',
            path: '/studio/audience?tab=tiers',
          },
          {
            id: 'studio-audience-stripe',
            label: 'Stripe',
            path: '/studio/stripe',
          },
        ],
      },
      { id: 'studio-releases', label: 'Releases', path: '/studio/releases' },
      { id: 'studio-editor', label: 'Editor', path: '/studio/editor' },
      {
        id: 'studio-go-live',
        label: 'Go Live',
        path: '/studio/go-live',
        children: [
          {
            id: 'studio-go-live-broadcast',
            label: 'Go Live',
            path: '/studio/go-live',
          },
          {
            id: 'studio-go-live-schedule',
            label: 'Schedule',
            path: '/studio/schedule',
          },
          {
            id: 'studio-go-live-events',
            label: 'Events',
            path: '/studio/events',
          },
          { id: 'studio-go-live-shows', label: 'Shows', path: '/studio/shows' },
          {
            id: 'studio-go-live-channel',
            label: 'Channel',
            path: '/studio/channel',
          },
          {
            id: 'studio-go-live-radio',
            label: 'Radio',
            path: '/studio/channel?tab=radio',
          },
        ],
      },
    ],
  },
  { id: 'settings', label: 'Settings', path: '/settings' },
];

function newItemId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `nav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addNode(
  items: NavigationStructureItem[],
  parentId: string | undefined,
  newItem: NavigationStructureItem,
): NavigationStructureItem[] {
  if (parentId === undefined) {
    return [...items, newItem];
  }
  return items.map((item) => {
    if (item.id === parentId) {
      return { ...item, children: [...(item.children ?? []), newItem] };
    }
    if (item.children) {
      return { ...item, children: addNode(item.children, parentId, newItem) };
    }
    return item;
  });
}

function removeNode(
  items: NavigationStructureItem[],
  id: string,
): NavigationStructureItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) =>
      item.children
        ? { ...item, children: removeNode(item.children, id) }
        : item,
    );
}

function moveWithinSiblings(
  items: NavigationStructureItem[],
  id: string,
  direction: -1 | 1,
): NavigationStructureItem[] {
  const index = items.findIndex((item) => item.id === id);
  if (index >= 0) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) {
      return items;
    }
    const clone = [...items];
    const [item] = clone.splice(index, 1);
    clone.splice(nextIndex, 0, item);
    return clone;
  }
  return items.map((item) =>
    item.children
      ? { ...item, children: moveWithinSiblings(item.children, id, direction) }
      : item,
  );
}

export const useNavigationStructureStore = create<NavigationStructureState>()(
  persist(
    (set) => ({
      items: DEFAULT_ITEMS,
      addItem: (label, path, parentId) => {
        const trimmedLabel = label.trim();
        const trimmedPath = path.trim();
        if (!trimmedLabel || !trimmedPath) {
          return;
        }
        set((state) => ({
          items: addNode(state.items, parentId, {
            id: newItemId(),
            label: trimmedLabel,
            path: trimmedPath,
          }),
        }));
      },
      removeItem: (id) =>
        set((state) => ({ items: removeNode(state.items, id) })),
      moveItem: (id, direction) =>
        set((state) => ({
          items: moveWithinSiblings(state.items, id, direction),
        })),
    }),
    { name: 'tahti-atlas-navigation-structure' },
  ),
);
