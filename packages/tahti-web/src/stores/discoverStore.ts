import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DiscoverWidgetId =
  | 'this-week-most-played'
  | 'this-week-least-played'
  | 'new-to-you'
  | 'latest-tracks'
  | 'most-played'
  | 'loved'
  | 'artist-of-the-week'
  | 'random-artist'
  | 'public-playlists'
  | 'tahti-selects'
  | 'latest-releases';

export const ALL_WIDGET_IDS: DiscoverWidgetId[] = [
  'this-week-most-played',
  'this-week-least-played',
  'new-to-you',
  'latest-tracks',
  'most-played',
  'loved',
  'artist-of-the-week',
  'random-artist',
  'public-playlists',
  'tahti-selects',
  'latest-releases',
];

export const DEFAULT_WIDGETS: DiscoverWidgetId[] = [
  'this-week-most-played',
  'new-to-you',
  'latest-tracks',
  'random-artist',
];

type DiscoverState = {
  enabledWidgets: DiscoverWidgetId[];
  genreFilter: string[];
  contentTypeFilter: string[];
  unheardOnly: boolean;
  /** How many days the random-artist widget keeps the same pick before
   * rotating to a new one. */
  randomArtistRotationDays: number;
  addWidget: (id: DiscoverWidgetId) => void;
  removeWidget: (id: DiscoverWidgetId) => void;
  moveWidget: (id: DiscoverWidgetId, direction: 'up' | 'down') => void;
  setGenreFilter: (genres: string[]) => void;
  setContentTypeFilter: (types: string[]) => void;
  setUnheardOnly: (enabled: boolean) => void;
  setRandomArtistRotationDays: (days: number) => void;
};

export const useDiscoverStore = create<DiscoverState>()(
  persist(
    (set) => ({
      enabledWidgets: DEFAULT_WIDGETS,
      genreFilter: [],
      contentTypeFilter: [],
      unheardOnly: false,
      randomArtistRotationDays: 1,

      addWidget: (id) =>
        set((s) =>
          s.enabledWidgets.includes(id)
            ? s
            : { enabledWidgets: [...s.enabledWidgets, id] },
        ),

      removeWidget: (id) =>
        set((s) => ({
          enabledWidgets: s.enabledWidgets.filter((w) => w !== id),
        })),

      moveWidget: (id, direction) =>
        set((s) => {
          const index = s.enabledWidgets.indexOf(id);
          if (index === -1) {
            return s;
          }
          const target = direction === 'up' ? index - 1 : index + 1;
          if (target < 0 || target >= s.enabledWidgets.length) {
            return s;
          }
          const next = [...s.enabledWidgets];
          [next[index], next[target]] = [next[target]!, next[index]!];
          return { enabledWidgets: next };
        }),

      setGenreFilter: (genres) => set({ genreFilter: genres }),
      setContentTypeFilter: (types) => set({ contentTypeFilter: types }),
      setUnheardOnly: (enabled) => set({ unheardOnly: enabled }),
      setRandomArtistRotationDays: (days) =>
        set({ randomArtistRotationDays: days }),
    }),
    { name: 'tahti-web:discover' },
  ),
);
