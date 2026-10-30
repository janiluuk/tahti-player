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
  | 'latest-releases'
  | 'random-track';

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
  'random-track',
];

/** Widgets added to the defaults in version 1 of the stored state. */
const ADDED_IN_V1: DiscoverWidgetId[] = [
  'tahti-selects',
  'latest-releases',
  'loved',
];

export const DEFAULT_WIDGETS: DiscoverWidgetId[] = [
  'this-week-most-played',
  'new-to-you',
  'latest-tracks',
  'random-artist',
  ...ADDED_IN_V1,
];

type DiscoverState = {
  enabledWidgets: DiscoverWidgetId[];
  genreFilter: string[];
  contentTypeFilter: string[];
  /** How many days the random-artist widget keeps the same pick before
   * rotating to a new one. */
  randomArtistRotationDays: number;
  /** Genres the random-track widget draws from; empty means all. */
  randomTrackGenres: string[];
  addWidget: (id: DiscoverWidgetId) => void;
  removeWidget: (id: DiscoverWidgetId) => void;
  moveWidget: (id: DiscoverWidgetId, direction: 'up' | 'down') => void;
  setGenreFilter: (genres: string[]) => void;
  setContentTypeFilter: (types: string[]) => void;
  setRandomArtistRotationDays: (days: number) => void;
  setRandomTrackGenres: (genres: string[]) => void;
};

export const useDiscoverStore = create<DiscoverState>()(
  persist(
    (set) => ({
      enabledWidgets: DEFAULT_WIDGETS,
      genreFilter: [],
      contentTypeFilter: [],
      randomArtistRotationDays: 1,
      randomTrackGenres: [],

      addWidget: (id) =>
        set((s) =>
          s.enabledWidgets.includes(id)
            ? s
            : { enabledWidgets: [id, ...s.enabledWidgets] },
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
      setRandomArtistRotationDays: (days) =>
        set({ randomArtistRotationDays: days }),
      setRandomTrackGenres: (genres) => set({ randomTrackGenres: genres }),
    }),
    {
      name: 'tahti-web:discover',
      version: 1,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<DiscoverState> & {
          unheardOnly?: boolean;
        };
        delete state.unheardOnly;
        if (version < 1 && Array.isArray(state.enabledWidgets)) {
          state.enabledWidgets = [
            ...state.enabledWidgets,
            ...ADDED_IN_V1.filter((id) => !state.enabledWidgets!.includes(id)),
          ];
        }
        return state as DiscoverState;
      },
    },
  ),
);
