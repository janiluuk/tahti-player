import type { TahtiPlayable } from '../api/types';

export type NativeLibraryTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  format: string;
  duration: number | null;
  sizeBytes: number;
  available: boolean;
  unavailableSince: string | null;
  albumArtist: string;
  trackNo: number | null;
  discNo: number | null;
  year: number | null;
  genre: string;
  comment: string;
  bitrateKbps: number | null;
};

export type NativeLibraryPage = {
  tracks: NativeLibraryTrack[];
  total: number;
};

export type NativeLibraryImportResult = {
  imported: number;
  /** Files walked (folder import / drag-drop) that had an unsupported extension. */
  skipped: number;
  errors: Array<{ path: string; error: string }>;
  /** True when `cancelImport` interrupted the loop before every path was processed. */
  cancelled: boolean;
};

export type NativeLibraryImportProgress = {
  done: number;
  total: number;
  imported: number;
  failed: number;
  skipped: number;
  /** `null` on the final (100%) event. */
  currentPath: string | null;
};

export type NativeLibraryRoot = {
  id: string;
  path: string;
  createdAt: string;
  lastScannedAt: string | null;
  trackCount: number;
  missingCount: number;
  /** Whether the folder itself currently exists (false for a disconnected drive). */
  available: boolean;
};

export type NativeRootScanResult = {
  imported: number;
  skipped: number;
  /** Known tracks whose file is no longer there. */
  missing: number;
  /** Previously-missing tracks whose file is back. */
  recovered: number;
  errors: Array<{ path: string; error: string }>;
  cancelled: boolean;
};

export type NativeRelinkRootResult = {
  root: NativeLibraryRoot;
  relinked: number;
  unmatched: number;
};

export type TahtiNativeLibrary = {
  list: (search: string, offset: number) => Promise<NativeLibraryPage>;
  import: () => Promise<NativeLibraryImportResult>;
  importFolder: () => Promise<NativeLibraryImportResult>;
  /** Imports an explicit list of file/folder paths — used for drag-drop. */
  importPaths: (paths: string[]) => Promise<NativeLibraryImportResult>;
  cancelImport: () => Promise<void>;
  resolve: (id: string) => Promise<string>;
  remove: (id: string) => Promise<void>;
  /** Reveals a track's original file in the OS file manager. */
  reveal: (id: string) => Promise<void>;
  listUnavailable: () => Promise<NativeLibraryTrack[]>;
  rescan: () => Promise<NativeLibraryTrack[]>;
  relink: (id: string) => Promise<NativeLibraryTrack | null>;
  listRoots: () => Promise<NativeLibraryRoot[]>;
  /** Picks a folder, registers it as a root and scans it. `null` if cancelled. */
  addRoot: () => Promise<NativeRootScanResult | null>;
  /** Stops tracking a root; its tracks stay in the catalog. */
  removeRoot: (id: string) => Promise<void>;
  /** Imports new files under every root and refreshes missing/recovered state. */
  rescanRoots: () => Promise<NativeRootScanResult>;
  /** Picks a replacement folder for a root. `null` if cancelled. */
  relinkRoot: (id: string) => Promise<NativeRelinkRootResult | null>;
  /** Subscribes to live import progress; returns an unsubscribe function. */
  onImportProgress: (
    listener: (progress: NativeLibraryImportProgress) => void,
  ) => () => void;
  /** Subscribes to files/folders dropped onto the app window; returns an unsubscribe function. */
  onFilesDropped: (listener: (paths: string[]) => void) => () => void;
};

declare global {
  var __TAHTI_NATIVE_LIBRARY__: TahtiNativeLibrary | undefined;
}

export function getNativeLibrary(): TahtiNativeLibrary | null {
  return globalThis.__TAHTI_NATIVE_LIBRARY__ ?? null;
}

export function playableFromNativeTrack(
  track: NativeLibraryTrack,
  streamUrl: string,
): TahtiPlayable {
  return {
    id: `local:${track.id}`,
    kind: 'sound',
    title: track.title,
    artist: track.artist || 'Unknown artist',
    streamUrl,
    protocol: 'https',
    sourceProvider: 'local',
    durationSec: track.duration,
  };
}

/**
 * A local playable's `streamUrl` is dropped before it's persisted to history
 * (see `redactEphemeralStreamUrl` in libraryStore) since it's a `blob:`
 * object URL or a Tauri `asset://` URL scoped to the session that created
 * it, dead by the time it's replayed from a fresh reload/restart. This
 * re-derives a live one from the native catalog by id; browser File-API
 * tracks have no durable handle to re-resolve from an id alone, so those
 * report unavailable instead of guessing.
 */
export async function resolveLocalPlayableForReplay(
  playable: TahtiPlayable,
): Promise<TahtiPlayable | null> {
  if (playable.sourceProvider !== 'local' || playable.streamUrl) {
    return playable;
  }
  const nativeLibrary = getNativeLibrary();
  if (!nativeLibrary) {
    return null;
  }
  const rawId = playable.id.replace(/^local:/, '');
  const streamUrl = await nativeLibrary.resolve(rawId);
  return { ...playable, streamUrl };
}

const LIST_CACHE_LIMIT = 60;

/**
 * Wraps a native library with an in-memory cache for the read paths the
 * Local files view hammers while typing/paging (`list`, `listUnavailable`,
 * `listRoots`). Identical (search, offset) requests — backspacing, returning
 * to a page, two components asking at once — resolve instantly and share one
 * in-flight IPC call. Any call that can change the catalog clears the cache,
 * and a result that was requested before a clear is never stored after it.
 * `resolve` is deliberately not cached: it doubles as a live existence check.
 */
export function withReadCache(library: TahtiNativeLibrary): TahtiNativeLibrary {
  const pages = new Map<string, Promise<NativeLibraryPage>>();
  let unavailable: Promise<NativeLibraryTrack[]> | null = null;
  let roots: Promise<NativeLibraryRoot[]> | null = null;

  const invalidate = () => {
    pages.clear();
    unavailable = null;
    roots = null;
  };
  const mutating =
    <Args extends unknown[], Result>(
      call: (...args: Args) => Promise<Result>,
    ) =>
    async (...args: Args): Promise<Result> => {
      try {
        return await call(...args);
      } finally {
        invalidate();
      }
    };

  return {
    ...library,
    list(search, offset) {
      const key = `${offset}\u0000${search}`;
      const hit = pages.get(key);
      if (hit) {
        pages.delete(key);
        pages.set(key, hit);
        return hit;
      }
      const request = library.list(search, offset);
      pages.set(key, request);
      if (pages.size > LIST_CACHE_LIMIT) {
        const oldest = pages.keys().next().value;
        if (oldest !== undefined) {
          pages.delete(oldest);
        }
      }
      request.catch(() => {
        if (pages.get(key) === request) {
          pages.delete(key);
        }
      });
      return request;
    },
    listUnavailable() {
      if (!unavailable) {
        const request = library.listUnavailable();
        unavailable = request;
        request.catch(() => {
          if (unavailable === request) {
            unavailable = null;
          }
        });
      }
      return unavailable;
    },
    listRoots() {
      if (!roots) {
        const request = library.listRoots();
        roots = request;
        request.catch(() => {
          if (roots === request) {
            roots = null;
          }
        });
      }
      return roots;
    },
    import: mutating(library.import),
    importFolder: mutating(library.importFolder),
    importPaths: mutating(library.importPaths),
    remove: mutating(library.remove),
    rescan: mutating(library.rescan),
    relink: mutating(library.relink),
    addRoot: mutating(library.addRoot),
    removeRoot: mutating(library.removeRoot),
    rescanRoots: mutating(library.rescanRoots),
    relinkRoot: mutating(library.relinkRoot),
  };
}
