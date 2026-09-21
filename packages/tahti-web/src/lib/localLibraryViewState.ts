import type { NativeFacetFilter, NativeTrackFilters } from './nativeLibrary';
import { EMPTY_TRACK_FILTERS } from './nativeLibrary';

export type LocalLibraryViewState = {
  query: string;
  browseKind:
    'tracks' | 'playlists' | 'artists' | 'albums' | 'genres' | 'folders';
  /** The playlist open in the Playlists tab, if any. */
  openPlaylistId: string | null;
  facetFilter: NativeFacetFilter | null;
  filters: NativeTrackFilters;
  /** Table scroll offset in px and how many rows had been loaded. */
  scrollOffset: number;
  loadedCount: number;
};

const KEY = 'tahti-local-library-view';
const MAX_RESTORED_ROWS = 2000;

export const DEFAULT_VIEW_STATE: LocalLibraryViewState = {
  query: '',
  browseKind: 'tracks',
  openPlaylistId: null,
  facetFilter: null,
  filters: EMPTY_TRACK_FILTERS,
  scrollOffset: 0,
  loadedCount: 0,
};

let current: LocalLibraryViewState | null = null;

function read(): LocalLibraryViewState {
  if (current) {
    return current;
  }
  try {
    const raw = window.sessionStorage.getItem(KEY);
    const parsed = raw
      ? (JSON.parse(raw) as Partial<LocalLibraryViewState>)
      : {};
    current = {
      ...DEFAULT_VIEW_STATE,
      ...parsed,
      filters: { ...EMPTY_TRACK_FILTERS, ...(parsed.filters ?? {}) },
    };
  } catch {
    current = DEFAULT_VIEW_STATE;
  }
  return current;
}

/** The last state of the Local files view, so leaving it (to open a track's
 * page, another tab, …) and coming back lands where you were. Lives in memory
 * for the session and mirrors to sessionStorage for reloads. */
export function loadViewState(): LocalLibraryViewState {
  return read();
}

function persist() {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Storage blocked: in-memory retention still works within the session.
  }
}

let pendingWrite: ReturnType<typeof setTimeout> | null = null;

/** Merges `patch` and mirrors it to sessionStorage right away. */
export function saveViewState(patch: Partial<LocalLibraryViewState>) {
  current = { ...read(), ...patch };
  if (pendingWrite !== null) {
    clearTimeout(pendingWrite);
    pendingWrite = null;
  }
  persist();
}

const DEFERRED_WRITE_MS = 250;

/**
 * For values that change every frame (the scroll offset): the in-memory state
 * updates immediately, but the JSON + sessionStorage write is coalesced so
 * scrolling doesn't serialize the whole view state on every tick. Call
 * `flushViewState` when the view goes away.
 */
export function saveViewStateDeferred(patch: Partial<LocalLibraryViewState>) {
  current = { ...read(), ...patch };
  if (pendingWrite === null) {
    pendingWrite = setTimeout(() => {
      pendingWrite = null;
      persist();
    }, DEFERRED_WRITE_MS);
  }
}

/** Writes any deferred state now (unmount, page hide). */
export function flushViewState() {
  if (pendingWrite !== null) {
    clearTimeout(pendingWrite);
    pendingWrite = null;
    persist();
  }
}

/** How many rows to preload so a saved scroll offset has rows under it. */
export function rowsToRestore(state: LocalLibraryViewState): number {
  return state.scrollOffset > 0
    ? Math.min(state.loadedCount, MAX_RESTORED_ROWS)
    : 0;
}

export function resetViewStateForTests() {
  if (pendingWrite !== null) {
    clearTimeout(pendingWrite);
    pendingWrite = null;
  }
  current = null;
}
