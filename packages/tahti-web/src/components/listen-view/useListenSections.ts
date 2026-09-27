import {
  useCallback,
  useEffect,
  useRef,
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

/** How long a section's last result is reused without asking the API again. */
export const LISTEN_CACHE_TTL_MS = 60_000;

const sectionCache = new Map<string, { data: unknown; at: number }>();

/** Forgets every cached section. */
export function clearListenSectionCache() {
  sectionCache.clear();
}

/** Loads one Listen section on its own, so a slow or failed request only
 * affects that section. The last result is cached per `cacheKey`: coming
 * back within `LISTEN_CACHE_TTL_MS` shows it without a request; after that it
 * is shown while a fresh copy loads, and kept if that refresh fails. A retry
 * always asks the API; only a retry after an error goes back to `loading`. */
function useListenSection<T>(
  load: () => Promise<T>,
  empty: T,
  reloadKey: number,
  cacheKey: string,
): [ListenSectionState<T>, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<ListenSectionState<T>>(() => {
    const hit = sectionCache.get(cacheKey);
    return hit
      ? { data: hit.data as T, status: 'ready' }
      : { data: empty, status: 'loading' };
  });
  const shownKey = useRef(cacheKey);

  useEffect(() => {
    const hit = sectionCache.get(cacheKey) as
      { data: T; at: number } | undefined;
    const keyChanged = shownKey.current !== cacheKey;
    shownKey.current = cacheKey;
    if (hit && reloadKey === 0 && Date.now() - hit.at < LISTEN_CACHE_TTL_MS) {
      setState({ data: hit.data, status: 'ready' });
      return;
    }
    let cancelled = false;
    setState((prev) => {
      if (hit && reloadKey === 0) {
        return { data: hit.data, status: 'ready' };
      }
      if (keyChanged) {
        return { data: empty, status: 'loading' };
      }
      return prev.status === 'error' ? { ...prev, status: 'loading' } : prev;
    });
    load()
      .then((data) => {
        sectionCache.set(cacheKey, { data, at: Date.now() });
        if (!cancelled) {
          setState({ data, status: 'ready' });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState(
            hit && reloadKey === 0
              ? { data: hit.data, status: 'ready' }
              : { data: empty, status: 'error' },
          );
        }
      });
    return () => {
      cancelled = true;
    };
    // `empty` is a module-level constant at every call site.
  }, [load, reloadKey, cacheKey]);

  const setData = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      setState((prev) => {
        const data =
          typeof next === 'function'
            ? (next as (current: T) => T)(prev.data)
            : next;
        const cached = sectionCache.get(cacheKey);
        if (cached) {
          sectionCache.set(cacheKey, { ...cached, data });
        }
        return { ...prev, data };
      });
    },
    [cacheKey],
  );

  return [state, setData];
}

const NO_CHANNELS: OnAirChannel[] = [];
const NO_PRESETS: EnabledInternetRadioPreset[] = [];
const NO_TRACKS: TahtiPlayable[] = [];
const NO_WIDGETS: DiscoWidgetRenderItem[] = [];

/** Everything the Listen dashboard fetches, one independent section each.
 * `viewerId` keys the signed-in listener's own widgets in the cache. */
export function useListenSections(signedIn: boolean, viewerId = '') {
  const [reloadKeys, setReloadKeys] = useState<
    Record<ListenSectionName, number>
  >({ radio: 0, onAir: 0, presets: 0, latestTracks: 0, discoWidgets: 0 });

  const loadWidgets = useCallback(() => loadDiscoWidgets(signedIn), [signedIn]);

  const [radio] = useListenSection(loadRadio, null, reloadKeys.radio, 'radio');
  const [onAir] = useListenSection(
    loadOnAir,
    NO_CHANNELS,
    reloadKeys.onAir,
    'onAir',
  );
  const [presets, setPresets] = useListenSection(
    loadPresets,
    NO_PRESETS,
    reloadKeys.presets,
    'presets',
  );
  const [latestTracks] = useListenSection(
    loadLatestTracks,
    NO_TRACKS,
    reloadKeys.latestTracks,
    'latestTracks',
  );
  const [discoWidgets] = useListenSection(
    loadWidgets,
    NO_WIDGETS,
    reloadKeys.discoWidgets,
    signedIn ? `discoWidgets:${viewerId}` : 'discoWidgets',
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
