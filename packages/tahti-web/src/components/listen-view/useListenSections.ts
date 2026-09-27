import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { TAHTI_RADIO_SLUG } from '../../api/client';
import {
  fetchDiscoverDiscoWidgets,
  fetchHomepageDiscoWidgets,
  type DiscoWidgetRenderItem,
} from '../../api/disco-widgets';
import { fetchLatestTracks } from '../../api/discover';
import { fetchOnAirChannels } from '../../api/listen';
import type { FetchMeta } from '../../api/mode';
import {
  fetchEnabledInternetRadioPresets,
  fetchRadioStation,
  type EnabledInternetRadioPreset,
} from '../../api/radio-public';
import type {
  OnAirChannel,
  PublicChannel,
  TahtiPlayable,
} from '../../api/types';
import { discoverTrackPlayable } from '../../lib/discoverTrackPlayable';

export type ListenSectionStatus = 'loading' | 'ready' | 'error';

export type ListenSectionName =
  'radio' | 'onAir' | 'presets' | 'latestTracks' | 'discoWidgets';

export type ListenSectionState<T> = { data: T; status: ListenSectionStatus };

const LATEST_TRACKS_LIMIT = 25;

/** The API clients swallow request errors and return empty data with a
 * `reason`; mock-fallback data (`source: 'mock'`) is still usable. */
function failed(meta: FetchMeta): boolean {
  return meta.source === 'api' && Boolean(meta.reason);
}

function unwrap<T>({ data, meta }: { data: T; meta: FetchMeta }): T {
  if (failed(meta)) {
    throw new Error(meta.reason);
  }
  return data;
}

async function loadRadio(): Promise<PublicChannel | null> {
  return (await fetchRadioStation()).data;
}

async function loadOnAir(): Promise<OnAirChannel[]> {
  const { live, replaying } = unwrap(await fetchOnAirChannels());
  const liveSlugs = new Set(live.map((channel) => channel.slug));
  return [...live, ...replaying]
    .filter((channel) => channel.slug !== TAHTI_RADIO_SLUG)
    .map((channel) => ({
      ...channel,
      state: liveSlugs.has(channel.slug) ? 'LIVE' : 'REPLAY',
    }));
}

async function loadPresets(): Promise<EnabledInternetRadioPreset[]> {
  return unwrap(await fetchEnabledInternetRadioPresets());
}

async function loadLatestTracks(): Promise<TahtiPlayable[]> {
  const tracks = unwrap(
    await fetchLatestTracks({ genres: [], contentTypes: [] }),
  );
  return tracks
    .map(discoverTrackPlayable)
    .filter((item): item is TahtiPlayable => item !== null)
    .slice(0, LATEST_TRACKS_LIMIT);
}

/** Signed-in listeners see their own widgets first, then the homepage ones
 * they haven't installed. Errors only when every request failed. */
async function loadDiscoWidgets(
  signedIn: boolean,
): Promise<DiscoWidgetRenderItem[]> {
  const [home, mine] = await Promise.all([
    fetchHomepageDiscoWidgets(),
    signedIn ? fetchDiscoverDiscoWidgets() : null,
  ]);
  const mineOk = mine !== null && !failed(mine.meta);
  if (failed(home.meta) && !mineOk) {
    throw new Error(home.meta.reason);
  }
  if (!mineOk) {
    return home.data;
  }
  const seen = new Set(mine.data.map((widget) => widget.installId));
  return [
    ...mine.data,
    ...home.data.filter((widget) => !seen.has(widget.installId)),
  ];
}

/** Loads one Listen section on its own, so a slow or failed request only
 * affects that section. A reload keeps showing the previous data; only a
 * retry after an error goes back to `loading`. */
function useListenSection<T>(
  load: () => Promise<T>,
  empty: T,
  reloadKey: number,
): [ListenSectionState<T>, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<ListenSectionState<T>>({
    data: empty,
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;
    setState((prev) =>
      prev.status === 'error' ? { ...prev, status: 'loading' } : prev,
    );
    load()
      .then((data) => {
        if (!cancelled) {
          setState({ data, status: 'ready' });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ data: empty, status: 'error' });
        }
      });
    return () => {
      cancelled = true;
    };
    // `empty` is a module-level constant at every call site.
  }, [load, reloadKey]);

  const setData = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    setState((prev) => ({
      ...prev,
      data:
        typeof next === 'function'
          ? (next as (current: T) => T)(prev.data)
          : next,
    }));
  }, []);

  return [state, setData];
}

const NO_CHANNELS: OnAirChannel[] = [];
const NO_PRESETS: EnabledInternetRadioPreset[] = [];
const NO_TRACKS: TahtiPlayable[] = [];
const NO_WIDGETS: DiscoWidgetRenderItem[] = [];

/** Everything the Listen dashboard fetches, one independent section each. */
export function useListenSections(signedIn: boolean) {
  const [reloadKeys, setReloadKeys] = useState<
    Record<ListenSectionName, number>
  >({ radio: 0, onAir: 0, presets: 0, latestTracks: 0, discoWidgets: 0 });

  const loadWidgets = useCallback(() => loadDiscoWidgets(signedIn), [signedIn]);

  const [radio] = useListenSection(loadRadio, null, reloadKeys.radio);
  const [onAir] = useListenSection(loadOnAir, NO_CHANNELS, reloadKeys.onAir);
  const [presets, setPresets] = useListenSection(
    loadPresets,
    NO_PRESETS,
    reloadKeys.presets,
  );
  const [latestTracks] = useListenSection(
    loadLatestTracks,
    NO_TRACKS,
    reloadKeys.latestTracks,
  );
  const [discoWidgets] = useListenSection(
    loadWidgets,
    NO_WIDGETS,
    reloadKeys.discoWidgets,
  );

  const retry = useCallback((section: ListenSectionName) => {
    setReloadKeys((keys) => ({ ...keys, [section]: keys[section] + 1 }));
  }, []);

  return {
    radio,
    onAir,
    presets,
    latestTracks,
    discoWidgets,
    setPresets,
    retry,
  };
}
