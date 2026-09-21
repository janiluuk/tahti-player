import type { TahtiPlayable } from '../api/types';
import type {
  NativeFacetGroup,
  NativeFacetKind,
  NativeLibraryPage,
  NativeLibraryRoot,
  NativeLibraryTotals,
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from './nativeLibrary.types';

export * from './nativeLibrary.types';

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
  let totals: Promise<NativeLibraryTotals> | null = null;
  const facets = new Map<NativeFacetKind, Promise<NativeFacetGroup[]>>();

  const invalidate = () => {
    pages.clear();
    facets.clear();
    totals = null;
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
    list(search, offset, filter, sort, filters) {
      const key = `${offset}\u0000${search}\u0000${
        filter
          ? `${filter.kind}\u0000${filter.value}\u0000${filter.secondary ?? ''}`
          : ''
      }\u0000${sort ? `${sort.column}:${sort.descending}` : ''}\u0000${filters ? JSON.stringify(filters) : ''}`;
      const hit = pages.get(key);
      if (hit) {
        pages.delete(key);
        pages.set(key, hit);
        return hit;
      }
      const request = library.list(search, offset, filter, sort, filters);
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
    facets(kind) {
      const hit = facets.get(kind);
      if (hit) {
        return hit;
      }
      const request = library.facets(kind);
      facets.set(kind, request);
      request.catch(() => {
        if (facets.get(kind) === request) {
          facets.delete(kind);
        }
      });
      return request;
    },
    totals() {
      if (!totals) {
        const request = library.totals();
        totals = request;
        request.catch(() => {
          if (totals === request) {
            totals = null;
          }
        });
      }
      return totals;
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
    removeMany: mutating(library.removeMany),
    rescan: mutating(library.rescan),
    relink: mutating(library.relink),
    addRoot: mutating(library.addRoot),
    removeRoot: mutating(library.removeRoot),
    rescanRoots: mutating(library.rescanRoots),
    relinkRoot: mutating(library.relinkRoot),
    analysis: {
      ...library.analysis,
      analyze: mutating(library.analysis.analyze),
      setCorrections: mutating(library.analysis.setCorrections),
      restoreCorrections: mutating(library.analysis.restoreCorrections),
      clear: mutating(library.analysis.clear),
    },
    catalog: {
      ...library.catalog,
      editTracks: mutating(library.catalog.editTracks),
      restoreEdits: mutating(library.catalog.restoreEdits),
      setRating: mutating(library.catalog.setRating),
      setColor: mutating(library.catalog.setColor),
      addTag: mutating(library.catalog.addTag),
      removeTag: mutating(library.catalog.removeTag),
      restoreUserData: mutating(library.catalog.restoreUserData),
      recordPlay: mutating(library.catalog.recordPlay),
      mergeTracks: mutating(library.catalog.mergeTracks),
      clearPlayHistory: mutating(library.catalog.clearPlayHistory),
      writeTags: mutating(library.catalog.writeTags),
      organizeApply: mutating(library.catalog.organizeApply),
      restoreBackup: mutating(library.catalog.restoreBackup),
    },
  };
}
