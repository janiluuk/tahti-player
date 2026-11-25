import { useCallback, useSyncExternalStore } from 'react';

type MatchMedia = (query: string) => MediaQueryList | null | undefined;

type Entry = {
  matchMedia: MatchMedia;
  list: MediaQueryList | null;
  listeners: Set<() => void>;
  notify: () => void;
};

const entries = new Map<string, Entry>();

function currentMatchMedia(): MatchMedia | null {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return null;
  }
  return window.matchMedia as MatchMedia;
}

/** Never throws: some jsdom setups leave `matchMedia` undefined or stub it
 * with a function returning `undefined` instead of a `MediaQueryList`. */
function resolve(matchMedia: MatchMedia, query: string): MediaQueryList | null {
  try {
    return matchMedia.call(window, query) ?? null;
  } catch {
    return null;
  }
}

function attach(entry: Entry) {
  entry.list?.addEventListener?.('change', entry.notify);
}

function detach(entry: Entry) {
  entry.list?.removeEventListener?.('change', entry.notify);
}

/**
 * The live entry for `query`. A `MediaQueryList` is only cached while
 * something is subscribed, and only for the `window.matchMedia` that made
 * it: tests swap or re-mock `matchMedia` between renders, and an entry kept
 * past the last unsubscribe (or across a swap) would report the old mock.
 */
function liveEntry(query: string): Entry | null {
  const entry = entries.get(query);
  if (!entry) {
    return null;
  }
  const matchMedia = currentMatchMedia();
  if (entry.matchMedia === matchMedia) {
    return entry;
  }
  detach(entry);
  if (!matchMedia) {
    entries.delete(query);
    return null;
  }
  entry.matchMedia = matchMedia;
  entry.list = resolve(matchMedia, query);
  attach(entry);
  return entry;
}

export function getMediaQueryMatches(query: string): boolean {
  const entry = liveEntry(query);
  if (entry) {
    return entry.list?.matches ?? false;
  }
  const matchMedia = currentMatchMedia();
  return (matchMedia && resolve(matchMedia, query)?.matches) ?? false;
}

/** One shared `change` listener per query, however many components watch it. */
export function subscribeMediaQuery(
  query: string,
  onChange: () => void,
): () => void {
  let entry = liveEntry(query);
  if (!entry) {
    const matchMedia = currentMatchMedia();
    if (!matchMedia) {
      return () => undefined;
    }
    const listeners = new Set<() => void>();
    entry = {
      matchMedia,
      list: resolve(matchMedia, query),
      listeners,
      notify: () => {
        for (const listener of [...listeners]) {
          listener();
        }
      },
    };
    entries.set(query, entry);
    attach(entry);
  }
  const subscribed = entry;
  subscribed.listeners.add(onChange);
  return () => {
    subscribed.listeners.delete(onChange);
    if (subscribed.listeners.size === 0 && entries.get(query) === subscribed) {
      detach(subscribed);
      entries.delete(query);
    }
  };
}

/** Live `matchMedia(query).matches`; false on the server or without
 * `matchMedia`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => subscribeMediaQuery(query, onChange),
    [query],
  );
  const getSnapshot = useCallback(() => getMediaQueryMatches(query), [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
