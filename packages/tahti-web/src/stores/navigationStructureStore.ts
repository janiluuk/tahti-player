import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavigationStructureItem = {
  id: string;
  label: string;
  path: string;
};

type NavigationStructureState = {
  items: NavigationStructureItem[];
  addItem: (label: string, path: string) => void;
  removeItem: (id: string) => void;
  moveItem: (id: string, direction: -1 | 1) => void;
};

const DEFAULT_ITEMS: NavigationStructureItem[] = [
  { id: 'listen', label: 'Listen', path: '/listen' },
  { id: 'discover', label: 'Discover', path: '/discover' },
  { id: 'radio', label: 'Radio', path: '/radio' },
  { id: 'library', label: 'Library', path: '/library' },
  { id: 'studio', label: 'Studio', path: '/studio' },
  { id: 'settings', label: 'Settings', path: '/settings' },
];

function newItemId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `nav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useNavigationStructureStore = create<NavigationStructureState>()(
  persist(
    (set) => ({
      items: DEFAULT_ITEMS,
      addItem: (label, path) => {
        const trimmedLabel = label.trim();
        const trimmedPath = path.trim();
        if (!trimmedLabel || !trimmedPath) {
          return;
        }
        set((state) => ({
          items: [
            ...state.items,
            { id: newItemId(), label: trimmedLabel, path: trimmedPath },
          ],
        }));
      },
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      moveItem: (id, direction) =>
        set((state) => {
          const index = state.items.findIndex((item) => item.id === id);
          const nextIndex = index + direction;
          if (index < 0 || nextIndex < 0 || nextIndex >= state.items.length) {
            return state;
          }
          const items = [...state.items];
          const [item] = items.splice(index, 1);
          if (item) {
            items.splice(nextIndex, 0, item);
          }
          return { items };
        }),
    }),
    { name: 'tahti-atlas-navigation-structure' },
  ),
);
