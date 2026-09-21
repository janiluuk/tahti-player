import { LaptopIcon, LibraryIcon, ListFilterIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button, EmptyState, Input } from '@tahti-player/ui';

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
  type NativeLibraryImportProgress,
  type NativeLibraryImportResult,
  type NativeLibraryTotals,
  type NativeLibraryTrack,
  type NativeTrackFilters,
} from '../lib/nativeLibrary';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { BrowserLocalFiles } from './desktop-library/BrowserLocalFiles';
import { describeImportFailures } from './desktop-library/importFailures';
import { LibraryRootsBlock } from './desktop-library/LibraryRootsBlock';
import { NativeTrackTable } from './desktop-library/NativeTrackTable';
import { basename } from './desktop-library/pathLabels';
import {
  TrackBatchDialogs,
  type TrackBatchDialog,
} from './desktop-library/TrackBatchDialogs';
import { useLibraryRoots } from './desktop-library/useLibraryRoots';
import { useNativeLibraryList } from './desktop-library/useNativeLibraryList';
import { useNativePlayback } from './desktop-library/useNativePlayback';
import { useSelectionActions } from './desktop-library/useSelectionActions';
import {
  BrowseTabs,
  FACET_KIND_LABEL,
  FacetGroupList,
  facetTitle,
  LibraryTotalsLine,
  type BrowseKind,
} from './LocalLibraryBrowse';
import { LocalLibraryFilters } from './LocalLibraryFilters';
import { LocalLibraryTools } from './LocalLibraryTools';
import { LocalPlaylists } from './LocalPlaylists';
import { NATIVE_TRACK_COLUMNS, toNativeSort } from './nativeTrackColumns';
import { TrackInspectorDialog } from './TrackInspectorDialog';

export function DesktopLibraryPanel() {
  const nativePlayer = hasNativePlayer();
  const nativeLibrary = getNativeLibrary();
  const initialView = useRef(loadViewState()).current;
  const [nativeQuery, setNativeQuery] = useState(initialView.query);
  const [debouncedNativeQuery, setDebouncedNativeQuery] = useState(
    initialView.query,
  );
  const [nativeUnavailable, setNativeUnavailable] = useState<
    NativeLibraryTrack[]
  >([]);
  const [nativeProgress, setNativeProgress] =
    useState<NativeLibraryImportProgress | null>(null);
  const lastFailedPathsRef = useRef<string[]>([]);
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
    setLoading: setNativeLoading,
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
    () => setNativeProgress(null),
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
  const {
    setSelectedIds,
    addToPlaylist,
    setAddToPlaylist,
    addGroupToPlaylist,
  } = selection;
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
    if (!nativeLibrary) {
      return;
    }
    return nativeLibrary.onImportProgress((progress) => {
      setNativeProgress(progress.currentPath === null ? null : progress);
    });
  }, [nativeLibrary]);

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

  const reportImportResult = (result: NativeLibraryImportResult) => {
    lastFailedPathsRef.current = result.errors.map((failure) => failure.path);
    if (result.imported > 0) {
      toast.success(
        result.imported === 1
          ? 'Imported 1 track.'
          : `Imported ${result.imported} tracks.`,
      );
    }
    if (result.errors.length) {
      toast.error(
        result.errors.length === 1
          ? '1 file could not be imported.'
          : `${result.errors.length} files could not be imported.`,
        {
          description: describeImportFailures(result.errors),
          action: {
            label: 'Retry',
            onClick: () => void retryFailedImport(),
          },
        },
      );
    }
    if (result.cancelled) {
      toast.info('Import cancelled.');
    }
    if (
      !result.imported &&
      !result.errors.length &&
      !result.cancelled &&
      result.skipped
    ) {
      toast.info(
        result.skipped === 1
          ? '1 file was not a supported audio format.'
          : `${result.skipped} files were not a supported audio format.`,
      );
    }
  };

  const runImport = useCallback(
    async (
      action: (
        library: NonNullable<typeof nativeLibrary>,
      ) => Promise<NativeLibraryImportResult>,
    ) => {
      if (!nativeLibrary) {
        return;
      }
      setNativeLoading(true);
      setNativeProgress(null);
      try {
        reportImportResult(await action(nativeLibrary));
        await refreshNative();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Import failed.');
      } finally {
        setNativeLoading(false);
        setNativeProgress(null);
      }
    },
    [nativeLibrary, refreshNative],
  );

  const importNative = () => runImport((library) => library.import());
  const importNativeFolder = () =>
    runImport((library) => library.importFolder());
  const retryFailedImport = () => {
    const paths = lastFailedPathsRef.current;
    if (!paths.length) {
      return Promise.resolve();
    }
    return runImport((library) => library.importPaths(paths));
  };
  const cancelNativeImport = () => {
    void nativeLibrary?.cancelImport();
  };

  useEffect(() => {
    if (!nativeLibrary) {
      return;
    }
    return nativeLibrary.onFilesDropped((paths) => {
      void runImport((library) => library.importPaths(paths));
    });
  }, [nativeLibrary, runImport]);

  const rescanNative = async () => {
    if (!nativeLibrary) {
      return;
    }
    setNativeLoading(true);
    try {
      const unavailable = await nativeLibrary.rescan();
      setNativeUnavailable(unavailable);
      await refreshNative();
      if (unavailable.length === 0) {
        toast.success('All library files are available.');
      } else {
        toast.info(
          unavailable.length === 1
            ? '1 library file is still missing.'
            : `${unavailable.length} library files are still missing.`,
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Re-scan failed.');
    } finally {
      setNativeLoading(false);
    }
  };

  const relinkNative = async (track: NativeLibraryTrack) => {
    if (!nativeLibrary) {
      return;
    }
    setNativeLoading(true);
    try {
      const replacement = await nativeLibrary.relink(track.id);
      if (!replacement) {
        return;
      }
      await refreshNative();
      toast.success(`Located “${replacement.title}”.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Relink failed.');
    } finally {
      setNativeLoading(false);
    }
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
      {nativeLibrary ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => void importNative()}
              disabled={nativeLoading}
            >
              <LibraryIcon size={15} aria-hidden />
              {nativeLoading ? 'Working…' : 'Import files'}
            </Button>
            <Button
              variant="text"
              onClick={() => void importNativeFolder()}
              disabled={nativeLoading}
            >
              Import folder
            </Button>
            {nativeUnavailable.length > 0 ? (
              <Button
                variant="text"
                onClick={() => void rescanNative()}
                disabled={nativeLoading}
              >
                Check missing files ({nativeUnavailable.length})
              </Button>
            ) : null}
            {nativeProgress ? (
              <Button
                variant="text"
                intent="danger"
                onClick={cancelNativeImport}
              >
                <XIcon size={14} aria-hidden />
                Cancel
              </Button>
            ) : null}
          </div>
          {nativeProgress ? (
            <p className="text-foreground-secondary text-xs">
              Importing {nativeProgress.done} of {nativeProgress.total} —{' '}
              {nativeProgress.imported} imported
              {nativeProgress.failed ? `, ${nativeProgress.failed} failed` : ''}
              {nativeProgress.skipped
                ? `, ${nativeProgress.skipped} skipped`
                : ''}
            </p>
          ) : null}
          <LibraryRootsBlock
            roots={roots}
            canToggleWatching={Boolean(nativeLibrary.setWatching)}
            watching={watching}
            rootBusy={rootBusy}
            loading={nativeLoading}
            onAdd={() => void addRoot()}
            onRescan={() => void rescanRoots()}
            onRelink={(root) => void relinkRoot(root)}
            onStopWatching={setRootToRemove}
            onChangeWatching={(enabled) => void changeWatching(enabled)}
          />
          <LocalLibraryTools
            library={nativeLibrary}
            onChanged={() => void refreshNative()}
          />
          <LibraryTotalsLine totals={totals} />
          <BrowseTabs value={browseKind} onChange={changeBrowseKind} />
          {browseKind === 'playlists' ? (
            <LocalPlaylists
              library={nativeLibrary}
              openId={openPlaylistId}
              onOpenChange={setOpenPlaylistId}
            />
          ) : browseKind !== 'tracks' && !facetFilter ? (
            facetGroups.length ? (
              <FacetGroupList
                kind={browseKind}
                groups={facetGroups}
                onSelect={selectFacetGroup}
                onAddToPlaylist={addGroupToPlaylist}
              />
            ) : (
              <EmptyState
                size="sm"
                icon={<LibraryIcon size={28} className="opacity-50" />}
                title={
                  facetLoading
                    ? 'Loading…'
                    : `No ${FACET_KIND_LABEL[browseKind].toLowerCase()} groups yet`
                }
                description={
                  facetLoading ? undefined : 'Import files to fill this view.'
                }
                className="flex-1"
              />
            )
          ) : (
            <>
              {facetFilter ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={`Clear ${FACET_KIND_LABEL[facetFilter.kind]} filter`}
                    onClick={() => setFacetFilter(null)}
                  >
                    <XIcon size={12} aria-hidden />
                    {FACET_KIND_LABEL[facetFilter.kind]}:{' '}
                    {facetTitle(facetFilter.kind, {
                      name: facetFilter.value,
                      secondary: facetFilter.secondary ?? '',
                      year: null,
                      trackCount: 0,
                      durationSec: 0,
                      sizeBytes: 0,
                    })}
                  </Button>
                </div>
              ) : null}
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    type="search"
                    label="Search desktop library"
                    placeholder="Title, artist, album, genre or path"
                    value={nativeQuery}
                    onChange={(event) => setNativeQuery(event.target.value)}
                  />
                </div>
                <Button
                  variant={activeFilterCount ? 'secondary' : 'text'}
                  aria-label={
                    activeFilterCount
                      ? `Filters (${activeFilterCount} active)`
                      : 'Filters'
                  }
                  onClick={() => setFiltersOpen(true)}
                >
                  <ListFilterIcon size={15} aria-hidden />
                  Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
                </Button>
              </div>
              {nativeTracks.length ? (
                <NativeTrackTable
                  table={table}
                  rows={nativeTracks}
                  total={nativeTotal}
                  loading={nativeLoading}
                  selection={selection}
                  initialScrollOffset={initialScrollRef.current}
                  loadedCountRef={loadedCountRef}
                  onLoadMore={() => void loadMoreNative()}
                  onPlay={(track) => void playNative(track)}
                  onQueue={(track) => void queueNative([track])}
                  onReveal={(track) => void revealNative(track)}
                  onRelink={(track) => void relinkNative(track)}
                  onInspect={setInspected}
                  onBatchDialog={(kind, ids) => setBatchDialog({ kind, ids })}
                  onRemove={(ids, title) => setPendingRemoval({ ids, title })}
                />
              ) : nativeError ? (
                <EmptyState
                  size="sm"
                  title="Desktop library unavailable"
                  description={nativeError}
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => void refreshNative()}
                    >
                      Retry
                    </Button>
                  }
                  className="flex-1"
                />
              ) : hasActiveScope && !nativeLoading ? (
                <EmptyState
                  size="sm"
                  icon={<ListFilterIcon size={28} className="opacity-50" />}
                  title="No tracks match"
                  description="Nothing in your library fits the current search, group and filters."
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setNativeQuery('');
                        setFacetFilter(null);
                        setFilters(EMPTY_TRACK_FILTERS);
                      }}
                    >
                      Clear search and filters
                    </Button>
                  }
                  className="flex-1"
                />
              ) : (
                <EmptyState
                  size="sm"
                  icon={<LibraryIcon size={28} className="opacity-50" />}
                  title="Desktop library"
                  description={
                    nativeLoading
                      ? 'Loading library…'
                      : 'Import files to build your offline library.'
                  }
                  className="flex-1"
                />
              )}
            </>
          )}
        </>
      ) : (
        <BrowserLocalFiles />
      )}
      {nativeLibrary ? (
        <AddToPlaylistDialog
          isOpen={addToPlaylist !== null}
          onClose={() => setAddToPlaylist(null)}
          library={nativeLibrary}
          summary={addToPlaylist?.summary ?? ''}
          resolveTrackIds={
            addToPlaylist?.resolve ?? (() => Promise.resolve([]))
          }
        />
      ) : null}
      <LocalLibraryFilters
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onApply={setFilters}
        options={filterOptions}
        tags={tagList}
        roots={roots}
      />
      {nativeLibrary ? (
        <TrackBatchDialogs
          library={nativeLibrary}
          dialog={batchDialog}
          onClose={() => setBatchDialog(null)}
          onChanged={() => void refreshNative()}
        />
      ) : null}
      <TrackInspectorDialog
        library={nativeLibrary}
        track={inspected}
        onChanged={() => void refreshNative()}
        onClose={() => setInspected(null)}
        onPlay={(track) => {
          setInspected(null);
          void playNative(track);
        }}
        onQueue={(track) => void queueNative([track])}
        onReveal={(track) => void revealNative(track)}
        onLocate={(track) => {
          setInspected(null);
          void relinkNative(track);
        }}
        onRemove={(track) => {
          setInspected(null);
          setPendingRemoval({ ids: [track.id], title: track.title });
        }}
      />
      <ConfirmDialog
        isOpen={pendingRemoval !== null}
        title={
          pendingRemoval && pendingRemoval.ids.length > 1
            ? `Remove ${pendingRemoval.ids.length.toLocaleString('en-US')} tracks from the library?`
            : 'Remove this track from the library?'
        }
        description="They are only removed from your Tahti library. The audio files on disk are not touched."
        confirmLabel="Remove"
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          const pending = pendingRemoval;
          setPendingRemoval(null);
          if (pending) {
            void removeNative(pending.ids, pending.title);
          }
        }}
      />
      <ConfirmDialog
        isOpen={rootToRemove !== null}
        title="Stop watching this folder?"
        description={`“${rootToRemove ? basename(rootToRemove.path) : ''}” will no longer be scanned for new files. Its tracks stay in your library and no files on disk are touched.`}
        confirmLabel="Stop watching"
        onCancel={() => setRootToRemove(null)}
        onConfirm={() => {
          const root = rootToRemove;
          setRootToRemove(null);
          if (root) {
            void removeRoot(root);
          }
        }}
      />
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
