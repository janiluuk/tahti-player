import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  DEFAULT_ENABLED_STATION_IDS,
  type RadioStation,
} from '../content/radioStations';

export const NEWS_WIDGET_TYPE_ID = 'news';

export type ListenerWidgetSurface = 'listen' | 'discover';

/** Radio Browser stations saved onto Listen tiles (not the curated catalog). */
export type SavedBrowserStation = {
  id: string;
  name: string;
  streamUrl: string;
  favicon?: string;
  country?: string;
};

/** One user-added external embed — see src/content/listenerWidgets.ts.
 * `news` instances store an RSS URL in `input` plus optional thumbnail
 * and which pages they appear on. */
export type ListenerWidgetInstance = {
  id: string;
  typeId: string;
  input: string;
  label: string;
  addedAt: string;
  thumbnailUrl?: string;
  surfaces?: ListenerWidgetSurface[];
};

export function widgetSurfaces(
  instance: ListenerWidgetInstance,
): ListenerWidgetSurface[] {
  return instance.surfaces ?? ['listen', 'discover'];
}

export function newsWidgetsOn(
  instances: ListenerWidgetInstance[],
  surface: ListenerWidgetSurface,
): ListenerWidgetInstance[] {
  return instances.filter(
    (instance) =>
      instance.typeId === NEWS_WIDGET_TYPE_ID &&
      widgetSurfaces(instance).includes(surface),
  );
}

type ListenerWidgetsState = {
  /** Widget types (SoundCloud, Spotify, YouTube) the user has "installed" from the
   * store — gates whether the add-instance form is shown. */
  installedTypeIds: string[];
  instances: ListenerWidgetInstance[];
  /** RADIO_STATIONS ids the user has enabled from the store. */
  enabledStationIds: string[];
  stationOverrides: Record<string, Partial<RadioStation>>;
  /** Radio Browser directory stations pinned to Listen. */
  savedBrowserStations: SavedBrowserStation[];
  installType: (typeId: string) => void;
  uninstallType: (typeId: string) => void;
  addInstance: (
    typeId: string,
    input: string,
    label: string,
    extras?: Pick<ListenerWidgetInstance, 'thumbnailUrl' | 'surfaces'>,
  ) => void;
  removeInstance: (id: string) => void;
  toggleStation: (stationId: string) => void;
  updateStation: (stationId: string, patch: Partial<RadioStation>) => void;
  toggleSavedBrowserStation: (station: SavedBrowserStation) => void;
  removeSavedBrowserStation: (id: string) => void;
};

export const useListenerWidgetsStore = create<ListenerWidgetsState>()(
  persist(
    (set) => ({
      installedTypeIds: [],
      instances: [],
      enabledStationIds: [...DEFAULT_ENABLED_STATION_IDS],
      stationOverrides: {},
      savedBrowserStations: [],
      installType: (typeId) =>
        set((s) => ({
          installedTypeIds: s.installedTypeIds.includes(typeId)
            ? s.installedTypeIds
            : [...s.installedTypeIds, typeId],
        })),
      uninstallType: (typeId) =>
        set((s) => ({
          installedTypeIds: s.installedTypeIds.filter((id) => id !== typeId),
          instances: s.instances.filter((i) => i.typeId !== typeId),
        })),
      addInstance: (typeId, input, label, extras) =>
        set((s) => ({
          instances: [
            ...s.instances,
            {
              id: crypto.randomUUID(),
              typeId,
              input,
              label,
              addedAt: new Date().toISOString(),
              thumbnailUrl: extras?.thumbnailUrl,
              surfaces: extras?.surfaces,
            },
          ],
        })),
      removeInstance: (id) =>
        set((s) => ({ instances: s.instances.filter((i) => i.id !== id) })),
      toggleStation: (stationId) =>
        set((s) => ({
          enabledStationIds: s.enabledStationIds.includes(stationId)
            ? s.enabledStationIds.filter((id) => id !== stationId)
            : [...s.enabledStationIds, stationId],
        })),
      updateStation: (stationId, patch) =>
        set((s) => ({
          stationOverrides: {
            ...s.stationOverrides,
            [stationId]: { ...s.stationOverrides[stationId], ...patch },
          },
        })),
      toggleSavedBrowserStation: (station) =>
        set((s) => {
          const exists = s.savedBrowserStations.some(
            (item) => item.id === station.id,
          );
          return {
            savedBrowserStations: exists
              ? s.savedBrowserStations.filter((item) => item.id !== station.id)
              : [...s.savedBrowserStations, station],
          };
        }),
      removeSavedBrowserStation: (id) =>
        set((s) => ({
          savedBrowserStations: s.savedBrowserStations.filter(
            (item) => item.id !== id,
          ),
        })),
    }),
    {
      name: 'tahti-web-listener-widgets',
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<ListenerWidgetsState>;
        if (
          version < 2 &&
          (!Array.isArray(state.enabledStationIds) ||
            state.enabledStationIds.length === 0)
        ) {
          state.enabledStationIds = [...DEFAULT_ENABLED_STATION_IDS];
        }
        return state as ListenerWidgetsState;
      },
    },
  ),
);
