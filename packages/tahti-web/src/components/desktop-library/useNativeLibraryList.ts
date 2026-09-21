import { useCallback, useRef, useState, type MutableRefObject } from 'react';

import type {
  NativeFacetFilter,
  NativeLibraryTrack,
  NativeTrackFilters,
  NativeTrackSort,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';

type ListScope = {
  library: TahtiNativeLibrary | null;
  query: string;
  facetFilter: NativeFacetFilter | null;
  sort: NativeTrackSort | null;
  filters: NativeTrackFilters;
  /** Rows to preload on the next first-page load (saved scroll position); reset to 0 once used. */
  restoreRef: MutableRefObject<number>;
};

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : 'Library unavailable.';

/**
 * The paged track list for the current search/group/filters/sort: first page
 * (`loadList`, plus the rows needed to restore a scroll position), further
 * pages (`loadMore`), with stale-response and double-fetch guards.
 */
export function useNativeLibraryList({
  library,
  query,
  facetFilter,
  sort,
  filters,
  restoreRef,
}: ListScope) {
  const [tracks, setTracks] = useState<NativeLibraryTrack[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const loadList = useCallback(async () => {
    if (!library) {
      return;
    }
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const page = await library.list(query, 0, facetFilter, sort, filters);
      if (request !== requestRef.current) {
        return;
      }
      let loaded = page.tracks;
      const restoreTarget = restoreRef.current;
      restoreRef.current = 0;
      for (
        let offset = loaded.length;
        offset < Math.min(restoreTarget, page.total);
        offset += page.tracks.length || 100
      ) {
        const more = await library.list(
          query,
          offset,
          facetFilter,
          sort,
          filters,
        );
        if (request !== requestRef.current) {
          return;
        }
        if (!more.tracks.length) {
          break;
        }
        loaded = [...loaded, ...more.tracks];
      }
      setTracks(loaded);
      setTotal(page.total);
    } catch (caught) {
      if (request === requestRef.current) {
        setError(messageOf(caught));
      }
    } finally {
      if (request === requestRef.current) {
        setLoading(false);
      }
    }
  }, [library, query, facetFilter, sort, filters, restoreRef]);

  const loadMore = async () => {
    // A second call before the first has settled (the table asks again on
    // every render) would fetch the same page twice.
    if (
      !library ||
      loading ||
      loadingMoreRef.current ||
      tracks.length >= total
    ) {
      return;
    }
    loadingMoreRef.current = true;
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const page = await library.list(
        query,
        tracks.length,
        facetFilter,
        sort,
        filters,
      );
      if (request !== requestRef.current) {
        return;
      }
      setTracks((current) => [...current, ...page.tracks]);
      // An empty page means the library shrank underneath us: settle on what
      // we have instead of asking for the same missing rows again.
      setTotal(page.tracks.length === 0 ? tracks.length : page.total);
    } catch (caught) {
      if (request === requestRef.current) {
        setError(messageOf(caught));
      }
    } finally {
      loadingMoreRef.current = false;
      if (request === requestRef.current) {
        setLoading(false);
      }
    }
  };

  return {
    tracks,
    total,
    loading,
    error,
    setLoading,
    setError,
    loadList,
    loadMore,
  };
}
