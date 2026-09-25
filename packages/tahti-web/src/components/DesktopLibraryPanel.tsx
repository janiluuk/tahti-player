import { LaptopIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@tahti-player/ui';

import { usePersistedCatalogTable } from '../hooks/usePersistedCatalogTable';
import {
  flushViewState,
  loadViewState,
  rowsToRestore,
  saveViewState,
} from '../lib/localLibraryViewState';
import { hasNativePlayer } from '../lib/nativeCapabilities';
import {
  countActiveFilters,
  EMPTY_TRACK_FILTERS,
  getNativeLibrary,
  type NativeFacetFilter,
  type NativeFacetGroup,
  type NativeFilterOptions,
  type NativeLibraryTotals,
  type NativeLibraryTrack,
  type NativeTrackFilters,
} from '../lib/nativeLibrary';
import { DesktopLibraryContent } from './desktop-library/DesktopLibraryContent';
import { DesktopLibraryDialogs } from './desktop-library/DesktopLibraryDialogs';
import { HearthisSetImportDialog } from './desktop-library/HearthisSetImportDialog';
import type { TrackBatchDialog } from './desktop-library/TrackBatchDialogs';
import { useLibraryRoots } from './desktop-library/useLibraryRoots';
import { useMissingTracks } from './desktop-library/useMissingTracks';
import { useNativeImport } from './desktop-library/useNativeImport';
import { useNativeLibraryList } from './desktop-library/useNativeLibraryList';
import { useNativePlayback } from './desktop-library/useNativePlayback';
import { useSelectionActions } from './desktop-library/useSelectionActions';
import type { BrowseKind } from './LocalLibraryBrowse';
import { NATIVE_TRACK_COLUMNS, toNativeSort } from './nativeTrackColumns';

export function DesktopLibraryPanel() {
  const nativePlayer = hasNativePlayer();
  const nativeLibrary = getNativeLibrary();
  const initialView = useRef(loadViewState()).current;
  const [nativeQuery, setNativeQuery] = useState(initialView.query);
  const [debouncedNativeQuery, setDebouncedNativeQuery] = useState(
    initialView.query,
  );
  const [busy, setBusy] = useState(false);
  const table = usePersistedCatalogTable(
    'tahti-local-library-table',
    NATIVE_TRACK_COLUMNS,
  );
  const nativeSort = useMemo(() => toNativeSort(table.sort), [table.sort]);
  const [pendingRemoval, setPendingRemoval] = useState<{
    ids: string[];
    title: string | null;
  } | null>(null);
  const [browseKind, setBrowseKind] = useState<BrowseKind>(
    initialView.browseKind,
  );
  const [facetFilter, setFacetFilter] = useState<NativeFacetFilter | null>(
    initialView.facetFilter,
  );
  const [filters, setFilters] = useState<NativeTrackFilters>(
    initialView.filters,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tagList, setTagList] = useState<
    Array<{ name: string; tracks: number }>
  >([]);
  const [batchDialog, setBatchDialog] = useState<TrackBatchDialog | null>(null);
  const [setImportOpen, setSetImportOpen] = useState(false);
  const [openPlaylistId, setOpenPlaylistId] = useState<string | null>(
    initialView.openPlaylistId,
  );
  const [filterOptions, setFilterOptions] =
    useState<NativeFilterOptions | null>(null);
  const [inspected, setInspected] = useState<NativeLibraryTrack | null>(null);
  // Rows to preload and the scroll offset to return to, used once on mount.
  const restoreRef = useRef(rowsToRestore(initialView));
  const {
    tracks: nativeTracks,
    total: nativeTotal,
    loading: nativeLoading,
    error: nativeError,
    setError: setNativeError,
    loadList,
    loadMore: loadMoreNative,
  } = useNativeLibraryList({
    library: nativeLibrary,
    query: debouncedNativeQuery,
    facetFilter,
    sort: nativeSort,
    filters,
    restoreRef,
  });
  const refreshNativeRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const {
    progress: nativeProgress,
    clearProgress,
    importFiles: importNative,
    importFolder: importNativeFolder,
    cancel: cancelNativeImport,
  } = useNativeImport(nativeLibrary, setBusy, () => refreshNativeRef.current());
  const {
    unavailable: nativeUnavailable,
    setUnavailable: setNativeUnavailable,
    rescan: rescanNative,
    relink: relinkNative,
  } = useMissingTracks(nativeLibrary, setBusy, () =>
    refreshNativeRef.current(),
  );
  const {
    roots,
    setRoots,
    watching,
    rootBusy,
    rootToRemove,
    setRootToRemove,
    changeWatching,
    addRoot,
    rescanRoots,
    relinkRoot,
    removeRoot,
  } = useLibraryRoots(
    nativeLibrary,
    () => refreshNativeRef.current(),
    clearProgress,
  );
  const selection = useSelectionActions({
    library: nativeLibrary,
    query: debouncedNativeQuery,
    facetFilter,
    sort: nativeSort,
    filters,
    total: nativeTotal,
    browseKind,
    refresh: () => refreshNativeRef.current(),
  });
  const { setSelectedIds } = selection;
  const { playNative, queueNative, revealNative } =
    useNativePlayback(nativeLibrary);
  const initialScrollRef = useRef(initialView.scrollOffset);
  const loadedCountRef = useRef(0);
  const scopeChangedRef = useRef(false);
  const [facetGroups, setFacetGroups] = useState<NativeFacetGroup[]>([]);
  const [facetLoading, setFacetLoading] = useState(false);
  const [totals, setTotals] = useState<NativeLibraryTotals | null>(null);
  const [catalogVersion, setCatalogVersion] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedNativeQuery(nativeQuery),
      nativeQuery === '' ? 0 : 120,
    );
    return () => window.clearTimeout(timer);
  }, [nativeQuery]);

  useEffect(() => {
    void nativeLibrary?.takeRecoveryNotice?.().then(
      (movedTo) => {
        if (movedTo) {
          toast.warning('Your library file was damaged and has been reset.', {
            description: `The damaged file was kept at ${movedTo}. Restore a catalog backup to get your ratings, tags and playlists back, then rescan your folders.`,
            duration: Infinity,
          });
        }
      },
      () => {},
    );
  }, [nativeLibrary]);

  useEffect(() => {
    window.addEventListener('pagehide', flushViewState);
    return () => {
      window.removeEventListener('pagehide', flushViewState);
      flushViewState();
    };
  }, []);

  useEffect(() => {
    loadedCountRef.current = nativeTracks.length;
  }, [nativeTracks.length]);

  // A selection belongs to the search/group/filters it was made in, and a
  // saved scroll position only makes sense for the scope it was saved in.
  useEffect(() => {
    setSelectedIds(new Set());
    if (scopeChangedRef.current) {
      restoreRef.current = 0;
      initialScrollRef.current = 0;
      saveViewState({ scrollOffset: 0, loadedCount: 0 });
    }
    scopeChangedRef.current = true;
  }, [debouncedNativeQuery, facetFilter, filters]);

  useEffect(() => {
    saveViewState({
      query: nativeQuery,
      browseKind,
      facetFilter,
      filters,
      openPlaylistId,
    });
  }, [nativeQuery, browseKind, facetFilter, filters, openPlaylistId]);

  useEffect(() => {
    if (!nativeLibrary) {
      return;
    }
    let stale = false;
    nativeLibrary.catalog
      .listTags()
      .then((tags) => {
        if (!stale) {
          setTagList(tags);
        }
      })
      .catch(() => undefined);
    return () => {
      stale = true;
    };
  }, [nativeLibrary, catalogVersion]);
  useEffect(() => {
    if (!nativeLibrary) {
      return;
    }
    let stale = false;
    nativeLibrary
      .filterOptions()
      .then((options) => {
        if (!stale) {
          setFilterOptions(options);
        }
      })
      .catch(() => undefined);
    return () => {
      stale = true;
    };
  }, [nativeLibrary, catalogVersion]);

  // Library-wide numbers (missing files, watched folders, totals) don't depend
  // on the search box, so they load on mount and after real changes only, not
  // on every keystroke, sort or filter change.
  const loadMeta = useCallback(async () => {
    if (!nativeLibrary) {
      return;
    }
    try {
      const [unavailable, rootList, libraryTotals] = await Promise.all([
        nativeLibrary.listUnavailable(),
        nativeLibrary.listRoots(),
        nativeLibrary.totals(),
      ]);
      setNativeUnavailable(unavailable);
      setRoots(rootList);
      setTotals(libraryTotals);
    } catch (error) {
      setNativeError(
        error instanceof Error ? error.message : 'Library unavailable.',
      );
    }
  }, [nativeLibrary]);

  // Something changed the catalog (import, edit, watcher, …): reload
  // everything, and let tags, filter options and groups refetch too.
  const refreshNative = useCallback(async () => {
    await Promise.all([loadList(), loadMeta()]);
    setCatalogVersion((version) => version + 1);
  }, [loadList, loadMeta]);
  refreshNativeRef.current = refreshNative;

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (
      !nativeLibrary ||
      browseKind === 'tracks' ||
      browseKind === 'playlists'
    ) {
      return;
    }
    let stale = false;
    setFacetLoading(true);
    nativeLibrary
      .facets(browseKind)
      .then((groups) => {
        if (!stale) {
          setFacetGroups(groups);
        }
      })
      .catch((error: unknown) => {
        if (!stale) {
          toast.error(
            error instanceof Error ? error.message : 'Could not load groups.',
          );
        }
      })
      .finally(() => {
        if (!stale) {
          setFacetLoading(false);
        }
      });
    return () => {
      stale = true;
    };
  }, [nativeLibrary, browseKind, catalogVersion]);

  const changeBrowseKind = (kind: BrowseKind) => {
    setBrowseKind(kind);
    setFacetFilter(null);
    setFacetGroups([]);
  };

  const selectFacetGroup = (group: NativeFacetGroup) => {
    if (browseKind === 'tracks' || browseKind === 'playlists') {
      return;
    }
    setFacetFilter({
      kind: browseKind,
      value: group.name,
      secondary: browseKind === 'albums' ? group.secondary : null,
    });
  };

  const removeNative = async (ids: string[], title: string | null) => {
    if (!nativeLibrary) {
      return;
    }
    try {
      const removed = await nativeLibrary.removeMany(ids);
      toast.success(
        removed === 1 && title
          ? `Removed “${title}” from the library.`
          : removed === 1
            ? 'Removed 1 track from the library.'
            : `Removed ${removed.toLocaleString('en-US')} tracks from the library.`,
      );
      setSelectedIds(new Set());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not remove tracks.',
      );
    }
    await refreshNative();
  };

  const activeFilterCount = countActiveFilters(filters);
  const hasActiveScope =
    nativeQuery.trim() !== '' || facetFilter !== null || activeFilterCount > 0;

  if (!nativePlayer) {
    return (
      <div
        className="flex h-full min-h-0 flex-col gap-3 p-2"
        data-testid="desktop-library-panel"
      >
        <EmptyState
          size="sm"
          icon={<LaptopIcon size={28} className="opacity-50" />}
          title="Desktop app only"
          description="Local library import needs the Tahti Player desktop app. Install it to import and play files stored on this device."
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col gap-3 p-2"
      data-testid="desktop-library-panel"
    >
      <DesktopLibraryContent
        library={nativeLibrary}
        busy={busy}
        progress={nativeProgress}
        unavailableCount={nativeUnavailable.length}
        roots={roots}
        watching={watching}
        rootBusy={rootBusy}
        totals={totals}
        browseKind={browseKind}
        openPlaylistId={openPlaylistId}
        facetFilter={facetFilter}
        facetGroups={facetGroups}
        facetLoading={facetLoading}
        query={nativeQuery}
        activeFilterCount={activeFilterCount}
        tracks={nativeTracks}
        total={nativeTotal}
        loading={nativeLoading}
        error={nativeError}
        hasActiveScope={hasActiveScope}
        table={table}
        selection={selection}
        initialScrollOffset={initialScrollRef.current}
        loadedCountRef={loadedCountRef}
        onImportFiles={() => void importNative()}
        onImportFolder={() => void importNativeFolder()}
        onImportSet={
          nativeLibrary?.providerImport
            ? () => setSetImportOpen(true)
            : undefined
        }
        onRescanMissing={() => void rescanNative()}
        onCancelImport={cancelNativeImport}
        onAddRoot={() => void addRoot()}
        onRescanRoots={() => void rescanRoots()}
        onRelinkRoot={(root) => void relinkRoot(root)}
        onStopWatchingRoot={setRootToRemove}
        onChangeWatching={(enabled) => void changeWatching(enabled)}
        onRefresh={() => void refreshNative()}
        onBrowseKindChange={changeBrowseKind}
        onOpenPlaylistChange={setOpenPlaylistId}
        onFacetSelect={selectFacetGroup}
        onFacetClear={() => setFacetFilter(null)}
        onQueryChange={setNativeQuery}
        onFiltersOpen={() => setFiltersOpen(true)}
        onClearScope={() => {
          setNativeQuery('');
          setFacetFilter(null);
          setFilters(EMPTY_TRACK_FILTERS);
        }}
        onLoadMore={() => void loadMoreNative()}
        onPlay={(track) => void playNative(track)}
        onQueue={(track) => void queueNative([track])}
        onReveal={(track) => void revealNative(track)}
        onRelink={(track) => void relinkNative(track)}
        onInspect={setInspected}
        onBatchDialog={(kind, ids) => setBatchDialog({ kind, ids })}
        onRemove={(ids, title) => setPendingRemoval({ ids, title })}
      />
      <DesktopLibraryDialogs
        library={nativeLibrary}
        selection={selection}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        tags={tagList}
        roots={roots}
        batchDialog={batchDialog}
        setBatchDialog={setBatchDialog}
        inspected={inspected}
        setInspected={setInspected}
        pendingRemoval={pendingRemoval}
        setPendingRemoval={setPendingRemoval}
        rootToRemove={rootToRemove}
        setRootToRemove={setRootToRemove}
        onRefresh={() => void refreshNative()}
        onPlay={(track) => void playNative(track)}
        onQueue={(track) => void queueNative([track])}
        onReveal={(track) => void revealNative(track)}
        onRelink={(track) => void relinkNative(track)}
        onRemove={(ids, title) => void removeNative(ids, title)}
        onRemoveRoot={(root) => void removeRoot(root)}
      />
      {nativeLibrary?.providerImport ? (
        <HearthisSetImportDialog
          isOpen={setImportOpen}
          onClose={() => setSetImportOpen(false)}
          providerImport={nativeLibrary.providerImport}
          onImported={() => void refreshNative()}
        />
      ) : null}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function describeTrackDetails(track: NativeLibraryTrack): string {
  return [
    track.album || 'Unknown album',
    track.year ? String(track.year) : null,
    track.genre || null,
    track.format.toUpperCase(),
    formatFileSize(track.sizeBytes),
    track.bitrateKbps ? `${track.bitrateKbps} kbps` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}
