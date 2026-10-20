import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  DEFAULT_ENABLED_STATION_IDS,
  type RadioStation,
} from '../content/radioStations';

export const NEWS_WIDGET_TYPE_ID = 'news';

export type ListenerWidgetSurface = 'listen' | 'discover';

/** Listen page block ids for user-added widgets; built-in sections use
 * their own ids (see ListenView). */
export const widgetBlockId = (id: string) => `widget:${id}`;
export const isWidgetBlockId = (id: string) => id.startsWith('widget:');
export const BROWSER_STATIONS_BLOCK_ID = widgetBlockId('browser-stations');
export const FAVORITES_BLOCK_ID = widgetBlockId('favorites');

const toFront = (order: string[], id: string) => [
  id,
  ...order.filter((item) => item !== id),
];

/** `order` first, then every id it lacks from `fallback`, each placed right
 * after the nearest id before it in `fallback` (or first when none is). */
export function mergeBlockOrder(order: string[], fallback: string[]): string[] {
  const result = [...order];
  fallback.forEach((id, index) => {
    if (result.includes(id)) {
      return;
    }
    const before = fallback
      .slice(0, index)
      .reverse()
      .find((item) => result.includes(item));
    result.splice(before === undefined ? 0 : result.indexOf(before) + 1, 0, id);
  });
  return result;
}

/** Radio Browser stations saved onto Listen tiles (not the curated catalog). */
export type SavedBrowserStation = {
  id: string;
  name: string;
  streamUrl: string;
  favicon?: string;
  country?: string;
  homepage?: string;
  countryCode?: string;
  description?: string;
  programmingUrl?: string;
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
  /** Listen page block order set from the Order toggle; new widgets go first. */
  listenOrder: string[];
  setListenOrder: (ids: string[]) => void;
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
  addSavedBrowserStation: (station: SavedBrowserStation) => void;
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
      listenOrder: [],
      setListenOrder: (ids) =>
        set((s) => ({ listenOrder: mergeBlockOrder(ids, s.listenOrder) })),
      installType: (typeId) =>
        set((s) =>
          s.installedTypeIds.includes(typeId)
            ? s
            : {
                installedTypeIds: [...s.installedTypeIds, typeId],
                listenOrder:
                  typeId === 'favorites'
                    ? toFront(s.listenOrder, FAVORITES_BLOCK_ID)
                    : s.listenOrder,
              },
        ),
      uninstallType: (typeId) =>
        set((s) => ({
          installedTypeIds: s.installedTypeIds.filter((id) => id !== typeId),
          instances: s.instances.filter((i) => i.typeId !== typeId),
        })),
      addInstance: (typeId, input, label, extras) =>
        set((s) => {
          const id = crypto.randomUUID();
          return {
            instances: [
              {
                id,
                typeId,
                input,
                label,
                addedAt: new Date().toISOString(),
                thumbnailUrl: extras?.thumbnailUrl,
                surfaces: extras?.surfaces,
              },
              ...s.instances,
            ],
            listenOrder: toFront(s.listenOrder, widgetBlockId(id)),
          };
        }),
      removeInstance: (id) =>
        set((s) => {
          const removed = s.instances.find((i) => i.id === id);
          const instances = s.instances.filter((i) => i.id !== id);
          if (!removed) {
            return { instances };
          }
          // Favorites has no instances — only Uninstall clears it. For
          // embed/news types, removing the last instance from Listen also
          // uninstalls so the store does not show a dead "Installed" row.
          if (removed.typeId === 'favorites') {
            return { instances };
          }
          const stillHasType = instances.some(
            (i) => i.typeId === removed.typeId,
          );
          if (stillHasType) {
            return { instances };
          }
          return {
            instances,
            installedTypeIds: s.installedTypeIds.filter(
              (typeId) => typeId !== removed.typeId,
            ),
          };
        }),
      toggleStation: (stationId) =>
        set((s) => ({
          enabledStationIds: s.enabledStationIds.includes(stationId)
            ? s.enabledStationIds.filter((id) => id !== stationId)
            : [stationId, ...s.enabledStationIds],
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
          if (exists) {
            return {
              savedBrowserStations: s.savedBrowserStations.filter(
                (item) => item.id !== station.id,
              ),
            };
          }
          return {
            savedBrowserStations: [station, ...s.savedBrowserStations],
            listenOrder: toFront(s.listenOrder, BROWSER_STATIONS_BLOCK_ID),
          };
        }),
      addSavedBrowserStation: (station) =>
        set((s) => {
          const existingIndex = s.savedBrowserStations.findIndex(
            (item) =>
              item.id === station.id || item.streamUrl === station.streamUrl,
          );
          if (existingIndex === -1) {
            return {
              savedBrowserStations: [station, ...s.savedBrowserStations],
              listenOrder: toFront(s.listenOrder, BROWSER_STATIONS_BLOCK_ID),
            };
          }
          const next = [...s.savedBrowserStations];
          next[existingIndex] = { ...next[existingIndex], ...station };
          return { savedBrowserStations: next };
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
