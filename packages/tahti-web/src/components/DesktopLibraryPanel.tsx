import {
  ActivityIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  FolderTreeIcon,
  InfoIcon,
  LaptopIcon,
  LibraryIcon,
  Link2Icon,
  ListFilterIcon,
  ListPlusIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlayIcon,
  RefreshCwIcon,
  SaveIcon,
  StarIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  CatalogTable,
  EmptyState,
  FilePicker,
  Input,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import type { TahtiPlayable } from '../api/types';
import { usePersistedCatalogTable } from '../hooks/usePersistedCatalogTable';
import {
  loadViewState,
  rowsToRestore,
  saveViewState,
} from '../lib/localLibraryViewState';
import { hasNativePlayer } from '../lib/nativeCapabilities';
import {
  countActiveFilters,
  EMPTY_TRACK_FILTERS,
  getNativeLibrary,
  playableFromNativeTrack,
  type NativeFacetFilter,
  type NativeFacetGroup,
  type NativeFilterOptions,
  type NativeLibraryImportProgress,
  type NativeLibraryImportResult,
  type NativeLibraryRoot,
  type NativeLibraryTotals,
  type NativeLibraryTrack,
  type NativeRootScanResult,
  type NativeTrackFilters,
} from '../lib/nativeLibrary';
import { preparePlayables } from '../lib/nativePlayback';
import {
  filterLocalLibraryTracks,
  isLocalTrackPlayable,
  playableFromLocalTrack,
  useLocalLibraryStore,
} from '../stores/localLibraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { runAnalysis } from './LocalLibraryAnalysis';
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
import { OrganizeFilesDialog } from './OrganizeFilesDialog';
import { PlayableTrackTable } from './PlayableTrackTable';
import { TrackEditorDialog } from './TrackEditorDialog';
import { TrackInspectorDialog } from './TrackInspectorDialog';
import { TrackOrganizeDialog } from './TrackOrganizeDialog';
import { WriteTagsDialog } from './WriteTagsDialog';

const FILE_LABELS = {
  title: 'Add audio files',
  description:
    'File names are remembered on this device. Audio blobs clear on reload — choose the same files again to play. Uploading to your Tahti archive is Studio → Upload.',
  browse: 'Choose files',
};

export function DesktopLibraryPanel() {
  const [query, setQuery] = useState('');
  const tracks = useLocalLibraryStore((s) => s.tracks);
  const addFiles = useLocalLibraryStore((s) => s.addFiles);
  const remove = useLocalLibraryStore((s) => s.remove);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const enqueueMany = usePlayerStore((s) => s.enqueueMany);
  const playNextMany = usePlayerStore((s) => s.playNextMany);
  const filteredTracks = useMemo(
    () => filterLocalLibraryTracks(tracks, query),
    [query, tracks],
  );
  const unresolvedTracks = useMemo(
    () => filteredTracks.filter((track) => !isLocalTrackPlayable(track)),
    [filteredTracks],
  );
  const playableLocalTracks = useMemo(
    () => filteredTracks.filter((track) => isLocalTrackPlayable(track)),
    [filteredTracks],
  );
  const playableItems = useMemo(
    () =>
      playableLocalTracks
        .map(playableFromLocalTrack)
        .filter((item): item is TahtiPlayable => item !== null),
    [playableLocalTracks],
  );
  const playableById = useMemo(
    () =>
      new Map(playableLocalTracks.map((track) => [`local:${track.id}`, track])),
    [playableLocalTracks],
  );
  const nativePlayer = hasNativePlayer();
  const nativeLibrary = getNativeLibrary();
  const [nativeTracks, setNativeTracks] = useState<NativeLibraryTrack[]>([]);
  const [nativeTotal, setNativeTotal] = useState(0);
  const initialView = useRef(loadViewState()).current;
  const [nativeQuery, setNativeQuery] = useState(initialView.query);
  const [debouncedNativeQuery, setDebouncedNativeQuery] = useState(
    initialView.query,
  );
  const [nativeLoading, setNativeLoading] = useState(false);
  const [nativeError, setNativeError] = useState<string | null>(null);
  const [nativeUnavailable, setNativeUnavailable] = useState<
    NativeLibraryTrack[]
  >([]);
  const [nativeProgress, setNativeProgress] =
    useState<NativeLibraryImportProgress | null>(null);
  const lastFailedPathsRef = useRef<string[]>([]);
  const listRequestRef = useRef(0);
  const table = usePersistedCatalogTable(
    'tahti-local-library-table',
    NATIVE_TRACK_COLUMNS,
  );
  const nativeSort = useMemo(() => toNativeSort(table.sort), [table.sort]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingRemoval, setPendingRemoval] = useState<{
    ids: string[];
    title: string | null;
  } | null>(null);
  const [selectingAll, setSelectingAll] = useState(false);
  const [selectionBusy, setSelectionBusy] = useState(false);
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
  const [editingIds, setEditingIds] = useState<string[] | null>(null);
  const [writingIds, setWritingIds] = useState<string[] | null>(null);
  const [organizingFilesIds, setOrganizingFilesIds] = useState<string[] | null>(
    null,
  );
  const [organizingIds, setOrganizingIds] = useState<string[] | null>(null);
  const [analyzingSelection, setAnalyzingSelection] = useState(false);
  const [openPlaylistId, setOpenPlaylistId] = useState<string | null>(
    initialView.openPlaylistId,
  );
  const [addToPlaylist, setAddToPlaylist] = useState<{
    summary: string;
    resolve: () => Promise<string[]>;
  } | null>(null);
  const [filterOptions, setFilterOptions] =
    useState<NativeFilterOptions | null>(null);
  const [inspected, setInspected] = useState<NativeLibraryTrack | null>(null);
  // Rows to preload and the scroll offset to return to, used once on mount.
  const restoreRef = useRef(rowsToRestore(initialView));
  const initialScrollRef = useRef(initialView.scrollOffset);
  const loadedCountRef = useRef(0);
  const scopeChangedRef = useRef(false);
  const [facetGroups, setFacetGroups] = useState<NativeFacetGroup[]>([]);
  const [facetLoading, setFacetLoading] = useState(false);
  const [totals, setTotals] = useState<NativeLibraryTotals | null>(null);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [roots, setRoots] = useState<NativeLibraryRoot[]>([]);
  const [watching, setWatching] = useState(true);
  const [rootBusy, setRootBusy] = useState<string | 'add' | 'rescan' | null>(
    null,
  );
  const [rootToRemove, setRootToRemove] = useState<NativeLibraryRoot | null>(
    null,
  );

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
    void nativeLibrary?.getWatching?.().then(setWatching, () => {});
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

  const changeWatching = async (enabled: boolean) => {
    if (!nativeLibrary?.setWatching) {
      return;
    }
    setWatching(enabled);
    try {
      await nativeLibrary.setWatching(enabled);
      toast.success(
        enabled
          ? 'Watching folders for changes.'
          : 'Folder watching paused — use Rescan to pick up changes.',
      );
    } catch (error) {
      setWatching(!enabled);
      toast.error(
        error instanceof Error ? error.message : 'Could not change watching.',
      );
    }
  };

  // The folder watcher reconciles roots on its own; refresh when it changed
  // something so the list never shows stale rows.
  useEffect(() => {
    if (!nativeLibrary?.onRootsChanged) {
      return;
    }
    return nativeLibrary.onRootsChanged((result) => {
      setCatalogVersion((version) => version + 1);
      describeRootScan(result);
    });
  }, [nativeLibrary]);

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

  const analyzeSelection = async () => {
    if (!nativeLibrary || analyzingSelection) {
      return;
    }
    setAnalyzingSelection(true);
    try {
      await runAnalysis(nativeLibrary, [...selectedIds]);
    } finally {
      setAnalyzingSelection(false);
      void refreshNative();
    }
  };

  const refreshNative = useCallback(async () => {
    if (!nativeLibrary) {
      return;
    }
    const request = ++listRequestRef.current;
    setNativeLoading(true);
    setNativeError(null);
    try {
      const [page, unavailable, rootList, libraryTotals] = await Promise.all([
        nativeLibrary.list(
          debouncedNativeQuery,
          0,
          facetFilter,
          nativeSort,
          filters,
        ),
        nativeLibrary.listUnavailable(),
        nativeLibrary.listRoots(),
        nativeLibrary.totals(),
      ]);
      if (request !== listRequestRef.current) {
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
        const more = await nativeLibrary.list(
          debouncedNativeQuery,
          offset,
          facetFilter,
          nativeSort,
          filters,
        );
        if (request !== listRequestRef.current) {
          return;
        }
        if (!more.tracks.length) {
          break;
        }
        loaded = [...loaded, ...more.tracks];
      }
      setNativeTracks(loaded);
      setNativeTotal(page.total);
      setNativeUnavailable(unavailable);
      setRoots(rootList);
      setTotals(libraryTotals);
      setCatalogVersion((version) => version + 1);
    } catch (error) {
      if (request === listRequestRef.current) {
        setNativeError(
          error instanceof Error ? error.message : 'Library unavailable.',
        );
      }
    } finally {
      if (request === listRequestRef.current) {
        setNativeLoading(false);
      }
    }
  }, [nativeLibrary, debouncedNativeQuery, facetFilter, nativeSort, filters]);

  const loadMoreNative = async () => {
    if (!nativeLibrary || nativeLoading || nativeTracks.length >= nativeTotal) {
      return;
    }
    const request = ++listRequestRef.current;
    setNativeLoading(true);
    setNativeError(null);
    try {
      const page = await nativeLibrary.list(
        debouncedNativeQuery,
        nativeTracks.length,
        facetFilter,
        nativeSort,
        filters,
      );
      if (request !== listRequestRef.current) {
        return;
      }
      setNativeTracks((current) => [...current, ...page.tracks]);
      // An empty page means the library shrank underneath us: settle on what
      // we have instead of asking for the same missing rows again.
      setNativeTotal(
        page.tracks.length === 0 ? nativeTracks.length : page.total,
      );
    } catch (error) {
      if (request === listRequestRef.current) {
        setNativeError(
          error instanceof Error ? error.message : 'Library unavailable.',
        );
      }
    } finally {
      if (request === listRequestRef.current) {
        setNativeLoading(false);
      }
    }
  };

  useEffect(() => {
    void refreshNative();
  }, [refreshNative]);

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

  const describeRootScan = (result: NativeRootScanResult) => {
    const parts = [
      result.imported ? `${result.imported} new` : null,
      result.recovered ? `${result.recovered} recovered` : null,
      result.moved ? `${result.moved} moved` : null,
      result.updated ? `${result.updated} updated` : null,
      result.missing ? `${result.missing} missing` : null,
    ].filter(Boolean);
    if (result.errors.length) {
      toast.error(
        result.errors.length === 1
          ? '1 file could not be scanned.'
          : `${result.errors.length} files could not be scanned.`,
        { description: describeImportFailures(result.errors) },
      );
    }
    if (result.cancelled) {
      toast.info('Scan cancelled.');
    } else if (parts.length) {
      toast.success(`Scan complete: ${parts.join(', ')}.`);
    } else if (!result.errors.length) {
      toast.success('Scan complete: nothing changed.');
    }
  };

  const runRootAction = async (
    busy: string,
    action: (library: NonNullable<typeof nativeLibrary>) => Promise<void>,
    failure: string,
  ) => {
    if (!nativeLibrary) {
      return;
    }
    setRootBusy(busy);
    setNativeProgress(null);
    try {
      await action(nativeLibrary);
      await refreshNative();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : failure);
    } finally {
      setRootBusy(null);
      setNativeProgress(null);
    }
  };

  const addRoot = () =>
    runRootAction(
      'add',
      async (library) => {
        const result = await library.addRoot();
        if (result) {
          describeRootScan(result);
        }
      },
      'Could not add folder.',
    );

  const rescanRoots = () =>
    runRootAction(
      'rescan',
      async (library) => describeRootScan(await library.rescanRoots()),
      'Scan failed.',
    );

  const relinkRoot = (root: NativeLibraryRoot) =>
    runRootAction(
      root.id,
      async (library) => {
        const result = await library.relinkRoot(root.id);
        if (result) {
          toast.success(
            result.unmatched
              ? `Relinked ${result.relinked} tracks; ${result.unmatched} not found in the new folder.`
              : `Relinked ${result.relinked} tracks.`,
          );
        }
      },
      'Relink failed.',
    );

  const removeRoot = (root: NativeLibraryRoot) =>
    runRootAction(
      root.id,
      async (library) => {
        await library.removeRoot(root.id);
        toast.success(
          `Stopped tracking “${basename(root.path)}”. Its tracks stay in your library.`,
        );
      },
      'Could not remove folder.',
    );

  const playNative = async (track: NativeLibraryTrack) => {
    if (!nativeLibrary) {
      return;
    }
    try {
      play(
        playableFromNativeTrack(track, await nativeLibrary.resolve(track.id)),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Track unavailable.',
      );
    }
  };

  const queueNative = async (tracks: NativeLibraryTrack[]) => {
    if (!nativeLibrary) {
      return;
    }
    let queued = 0;
    for (const track of tracks) {
      try {
        enqueue(
          playableFromNativeTrack(track, await nativeLibrary.resolve(track.id)),
        );
        queued += 1;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Track unavailable.',
        );
      }
    }
    if (queued) {
      toast.success(
        queued === 1
          ? 'Added 1 track to the queue.'
          : `Added ${queued} tracks to the queue.`,
      );
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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not remove tracks.',
      );
    }
    setSelectedIds(new Set());
    await refreshNative();
  };

  const selectAllMatching = async () => {
    if (!nativeLibrary) {
      return;
    }
    setSelectingAll(true);
    try {
      setSelectedIds(
        new Set(
          await nativeLibrary.matchingIds(
            debouncedNativeQuery,
            facetFilter,
            nativeSort,
            filters,
          ),
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not select all tracks.',
      );
    } finally {
      setSelectingAll(false);
    }
  };

  /**
   * Turns tracks into playables, in the order the table currently shows them
   * (not the order they were clicked), so what plays or queues is
   * predictable. `pick` narrows the shown order (to the selection, or not at
   * all for "play all"). Capped so a whole-library action can't flood the queue.
   */
  const playablesFor = async (
    pick: (shownIds: string[]) => string[],
    noun: string,
  ) => {
    if (!nativeLibrary) {
      return null;
    }
    const shown = await nativeLibrary.matchingIds(
      debouncedNativeQuery,
      facetFilter,
      nativeSort,
      filters,
    );
    return preparePlayables(nativeLibrary, pick(shown), noun);
  };

  const runSelectionAction = async (
    action: (playables: TahtiPlayable[]) => void,
    scope: 'selected' | 'all' = 'selected',
  ) => {
    setSelectionBusy(true);
    try {
      const playables =
        scope === 'all'
          ? await playablesFor((shown) => shown, 'matching')
          : await playablesFor(
              (shown) => shown.filter((id) => selectedIds.has(id)),
              'selected',
            );
      if (playables?.length) {
        action(playables);
      } else if (playables) {
        toast.error('None of these tracks can be played.');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not use the selection.',
      );
    } finally {
      setSelectionBusy(false);
    }
  };

  const playSelection = () =>
    runSelectionAction((playables) => {
      const [head, ...rest] = playables;
      if (head) {
        play(head, { enqueueRest: rest });
      }
    });
  const playAllMatching = () =>
    runSelectionAction((playables) => {
      const [head, ...rest] = playables;
      if (head) {
        play(head, { enqueueRest: rest });
      }
    }, 'all');
  const playNextSelection = () =>
    runSelectionAction((playables) => {
      playNextMany(playables);
      toast.success(
        playables.length === 1
          ? 'Playing 1 track next.'
          : `Playing ${playables.length.toLocaleString('en-US')} tracks next.`,
      );
    });
  const queueSelection = () =>
    runSelectionAction((playables) => {
      enqueueMany(playables);
    });

  const idsInShownOrder = (pick: (shown: string[]) => string[]) => async () => {
    if (!nativeLibrary) {
      return [];
    }
    return pick(
      await nativeLibrary.matchingIds(
        debouncedNativeQuery,
        facetFilter,
        nativeSort,
        filters,
      ),
    );
  };
  const addSelectionToPlaylist = () =>
    setAddToPlaylist({
      summary:
        selectedIds.size === 1
          ? '1 selected track'
          : `${selectedIds.size.toLocaleString('en-US')} selected tracks`,
      resolve: idsInShownOrder((shown) =>
        shown.filter((id) => selectedIds.has(id)),
      ),
    });
  const addAllToPlaylist = () =>
    setAddToPlaylist({
      summary: `All ${nativeTotal.toLocaleString('en-US')} tracks matching the current view`,
      resolve: idsInShownOrder((shown) => shown),
    });
  const addGroupToPlaylist = (group: NativeFacetGroup) => {
    if (
      !nativeLibrary ||
      browseKind === 'tracks' ||
      browseKind === 'playlists'
    ) {
      return;
    }
    const kind = browseKind;
    setAddToPlaylist({
      summary: `${group.trackCount.toLocaleString('en-US')} tracks from “${facetTitle(kind, group)}”`,
      resolve: () =>
        nativeLibrary.matchingIds(
          '',
          {
            kind,
            value: group.name,
            secondary: kind === 'albums' ? group.secondary : null,
          },
          // Album order (disc, then track) for anything that is an album or a
          // folder of albums; title order for genres.
          kind === 'genres' ? null : { column: 'album', descending: false },
          null,
        ),
    });
  };

  const activeFilterCount = countActiveFilters(filters);
  const hasActiveScope =
    nativeQuery.trim() !== '' || facetFilter !== null || activeFilterCount > 0;

  const revealNative = async (track: NativeLibraryTrack) => {
    if (!nativeLibrary) {
      return;
    }
    try {
      await nativeLibrary.reveal(track.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not reveal file.',
      );
    }
  };

  const onFiles = (files: readonly File[]) => {
    const added = addFiles(files);
    if (added.length === 0) {
      toast.error('Choose an audio file.');
      return;
    }
    toast.success(
      added.length === 1
        ? `Ready “${added[0]?.title}”.`
        : `Ready ${added.length} files.`,
    );
  };

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
          <div
            className="border-border flex flex-col gap-1.5 rounded-md border p-2"
            data-testid="library-roots"
          >
            <div className="flex items-center gap-1">
              <p className="flex-1 text-xs font-semibold">Watched folders</p>
              <Button
                size="sm"
                variant="text"
                onClick={() => void addRoot()}
                disabled={nativeLoading || rootBusy !== null}
              >
                {rootBusy === 'add' ? (
                  <LoaderCircleIcon
                    size={14}
                    className="animate-spin"
                    aria-hidden
                  />
                ) : (
                  <FolderPlusIcon size={14} aria-hidden />
                )}
                Add folder
              </Button>
              {roots.length > 0 && nativeLibrary?.setWatching ? (
                <Toggle
                  label="Watch folders for changes"
                  checked={watching}
                  onChange={(enabled) => void changeWatching(enabled)}
                />
              ) : null}
              {roots.length > 0 ? (
                <Button
                  size="sm"
                  variant="text"
                  onClick={() => void rescanRoots()}
                  disabled={nativeLoading || rootBusy !== null}
                >
                  {rootBusy === 'rescan' ? (
                    <LoaderCircleIcon
                      size={14}
                      className="animate-spin"
                      aria-hidden
                    />
                  ) : (
                    <RefreshCwIcon size={14} aria-hidden />
                  )}
                  Rescan
                </Button>
              ) : null}
            </div>
            {roots.length === 0 ? (
              <p className="text-foreground-secondary text-xs">
                Add a folder to keep it in sync — new files are picked up on
                rescan and moved drives can be relinked in one step.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {roots.map((root) => (
                  <li key={root.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1" title={root.path}>
                      <p className="truncate text-xs font-semibold">
                        {basename(root.path)}
                      </p>
                      <p
                        className={
                          root.available
                            ? 'text-foreground-secondary truncate text-[10px]'
                            : 'text-destructive truncate text-[10px]'
                        }
                      >
                        {root.available
                          ? `${root.trackCount} tracks${
                              root.missingCount
                                ? ` · ${root.missingCount} missing`
                                : ''
                            }`
                          : 'Folder not found — reconnect the drive or relink'}
                      </p>
                    </div>
                    <Tooltip content="Relink to another folder" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        aria-label={`Relink ${basename(root.path)}`}
                        onClick={() => void relinkRoot(root)}
                        disabled={nativeLoading || rootBusy !== null}
                      >
                        {rootBusy === root.id ? (
                          <LoaderCircleIcon
                            size={14}
                            className="animate-spin"
                            aria-hidden
                          />
                        ) : (
                          <Link2Icon size={14} aria-hidden />
                        )}
                      </Button>
                    </Tooltip>
                    <Tooltip content="Stop watching" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        intent="danger"
                        aria-label={`Stop watching ${basename(root.path)}`}
                        onClick={() => setRootToRemove(root)}
                        disabled={rootBusy !== null}
                      >
                        <TrashIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
                <CatalogTable
                  columns={NATIVE_TRACK_COLUMNS}
                  view={table.view}
                  onViewChange={table.setView}
                  rows={nativeTracks}
                  total={nativeTotal}
                  itemNoun="tracks"
                  getRowId={(track) => track.id}
                  getRowLabel={(track) => track.title}
                  sort={table.sort}
                  onSortChange={table.setSort}
                  onLoadMore={() => void loadMoreNative()}
                  loading={nativeLoading}
                  selectedIds={selectedIds}
                  onSelectedIdsChange={setSelectedIds}
                  isRowMuted={(track) => !track.available}
                  initialScrollOffset={initialScrollRef.current}
                  onScrollOffsetChange={(offset) => {
                    saveViewState({
                      scrollOffset: offset,
                      loadedCount: loadedCountRef.current,
                    });
                  }}
                  layouts={table.layouts}
                  onActivateRow={(track) => {
                    if (track.available) {
                      void playNative(track);
                    }
                  }}
                  onRowKeyDown={(event, track) => {
                    if (event.key.toLowerCase() === 'i') {
                      event.preventDefault();
                      setInspected(track);
                    } else if (event.key.toLowerCase() === 'e') {
                      event.preventDefault();
                      setEditingIds([track.id]);
                    }
                  }}
                  onSelectAllMatching={() => void selectAllMatching()}
                  selectingAll={selectingAll}
                  toolbar={
                    !selectedIds.size ? (
                      <>
                        <Button
                          size="sm"
                          variant="text"
                          disabled={selectionBusy}
                          onClick={() => void playAllMatching()}
                        >
                          {selectionBusy ? (
                            <LoaderCircleIcon
                              size={14}
                              className="animate-spin"
                              aria-hidden
                            />
                          ) : (
                            <PlayIcon size={14} aria-hidden />
                          )}
                          Play all
                        </Button>
                        <Button
                          size="sm"
                          variant="text"
                          disabled={selectionBusy || nativeTotal === 0}
                          onClick={addAllToPlaylist}
                        >
                          <ListPlusIcon size={14} aria-hidden />
                          Add all to playlist
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="text"
                          disabled={selectionBusy}
                          onClick={() => void playSelection()}
                        >
                          {selectionBusy ? (
                            <LoaderCircleIcon
                              size={14}
                              className="animate-spin"
                              aria-hidden
                            />
                          ) : (
                            <PlayIcon size={14} aria-hidden />
                          )}
                          Play
                        </Button>
                        <Button
                          size="sm"
                          variant="text"
                          disabled={selectionBusy}
                          onClick={() => void playNextSelection()}
                        >
                          Play next
                        </Button>
                        <Button
                          size="sm"
                          variant="text"
                          disabled={selectionBusy}
                          onClick={() => void queueSelection()}
                        >
                          Add to queue
                        </Button>
                        <Button
                          size="sm"
                          variant="text"
                          disabled={selectionBusy}
                          onClick={() => setEditingIds([...selectedIds])}
                        >
                          <PencilIcon size={14} aria-hidden />
                          Edit tags
                        </Button>
                        <Button
                          size="sm"
                          variant="text"
                          disabled={selectionBusy}
                          onClick={() => setWritingIds([...selectedIds])}
                        >
                          <SaveIcon size={14} aria-hidden />
                          Write tags to files
                        </Button>
                        <Button
                          size="sm"
                          variant="text"
                          disabled={selectionBusy}
                          onClick={() =>
                            setOrganizingFilesIds([...selectedIds])
                          }
                        >
                          <FolderTreeIcon size={14} aria-hidden />
                          Organize files
                        </Button>
                        <Button
                          size="sm"
                          variant="text"
                          disabled={selectionBusy || analyzingSelection}
                          onClick={() => void analyzeSelection()}
                        >
                          {analyzingSelection ? (
                            <LoaderCircleIcon
                              size={14}
                              className="animate-spin"
                              aria-hidden
                            />
                          ) : (
                            <ActivityIcon size={14} aria-hidden />
                          )}
                          Analyze
                        </Button>
                        <Button
                          size="sm"
                          variant="text"
                          disabled={selectionBusy}
                          onClick={() => setOrganizingIds([...selectedIds])}
                        >
                          <StarIcon size={14} aria-hidden />
                          Rate and label
                        </Button>
                        <Button
                          size="sm"
                          variant="text"
                          disabled={selectionBusy}
                          onClick={addSelectionToPlaylist}
                        >
                          <ListPlusIcon size={14} aria-hidden />
                          Add to playlist
                        </Button>
                        <Button
                          size="sm"
                          variant="text"
                          intent="danger"
                          disabled={selectionBusy}
                          onClick={() =>
                            setPendingRemoval({
                              ids: [...selectedIds],
                              title: null,
                            })
                          }
                        >
                          <TrashIcon size={14} aria-hidden />
                          Remove
                        </Button>
                      </>
                    )
                  }
                  renderActions={(track) => (
                    <>
                      {!track.available ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void relinkNative(track)}
                          disabled={nativeLoading}
                        >
                          Locate
                        </Button>
                      ) : (
                        <>
                          <Tooltip content="Play" side="top">
                            <Button
                              size="icon-sm"
                              variant="text"
                              aria-label={`Play ${track.title}`}
                              onClick={() => void playNative(track)}
                            >
                              <PlayIcon size={14} aria-hidden />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Add to queue" side="top">
                            <Button
                              size="sm"
                              variant="text"
                              aria-label={`Queue ${track.title}`}
                              onClick={() => void queueNative([track])}
                            >
                              Queue
                            </Button>
                          </Tooltip>
                          <Tooltip content="Reveal in folder" side="top">
                            <Button
                              size="icon-sm"
                              variant="text"
                              aria-label={`Reveal ${track.title} in folder`}
                              onClick={() => void revealNative(track)}
                            >
                              <FolderOpenIcon size={14} aria-hidden />
                            </Button>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip content="Edit tags (E)" side="top">
                        <Button
                          size="icon-sm"
                          variant="text"
                          aria-label={`Edit tags for ${track.title}`}
                          onClick={() => setEditingIds([track.id])}
                        >
                          <PencilIcon size={14} aria-hidden />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Details (I)" side="top">
                        <Button
                          size="icon-sm"
                          variant="text"
                          aria-label={`Details for ${track.title}`}
                          onClick={() => setInspected(track)}
                        >
                          <InfoIcon size={14} aria-hidden />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Remove from library" side="top">
                        <Button
                          size="icon-sm"
                          variant="text"
                          intent="danger"
                          aria-label={`Remove ${track.title}`}
                          onClick={() =>
                            setPendingRemoval({
                              ids: [track.id],
                              title: track.title,
                            })
                          }
                        >
                          <TrashIcon size={14} aria-hidden />
                        </Button>
                      </Tooltip>
                    </>
                  )}
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
        <FilePicker
          accept="audio/*"
          multiple
          labels={FILE_LABELS}
          onFiles={onFiles}
        />
      )}
      {nativePlayer && !nativeLibrary ? (
        <p className="border-primary/30 bg-primary/5 text-foreground-secondary rounded-md border px-2 py-1.5 text-xs">
          Tahti Player desktop runtime detected. Native library is unavailable;
          browser imports remain available.
        </p>
      ) : null}
      {!nativeLibrary &&
        (tracks.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<LibraryIcon size={28} className="opacity-50" />}
            title="Local library"
            description="Import files to play them in the Tahti player. Soulseek search lands here after the desktop add-on is connected."
            className="flex-1"
          />
        ) : (
          <>
            <Input
              type="search"
              label="Search local files"
              placeholder="Title, artist, or file name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {unresolvedTracks.length > 0 ? (
              <ul className="tahti-hide-scrollbar flex max-h-32 flex-col gap-1 overflow-y-auto">
                {unresolvedTracks.map((track) => (
                  <li
                    key={track.id}
                    className="border-border flex items-center gap-2 rounded-md border px-2 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {track.title}
                      </p>
                      <p className="text-foreground-secondary truncate text-xs">
                        Re-import {track.fileName} to play
                      </p>
                    </div>
                    <Tooltip content="Remove" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        intent="danger"
                        aria-label={`Remove ${track.title}`}
                        onClick={() => {
                          remove(track.id);
                          toast.success(`Removed “${track.title}”.`);
                        }}
                      >
                        <TrashIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            ) : null}
            {playableItems.length === 0 ? (
              unresolvedTracks.length === 0 ? (
                <EmptyState
                  size="sm"
                  title="No local files found"
                  description={`Nothing matches “${query.trim()}”.`}
                  className="flex-1"
                />
              ) : null
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <PlayableTrackTable
                  items={playableItems}
                  selectable
                  onRemove={(item) => {
                    const track = playableById.get(item.id);
                    if (!track) {
                      return;
                    }
                    remove(track.id);
                    toast.success(`Removed “${item.title}”.`);
                  }}
                  onBulkRemove={(items) => {
                    for (const item of items) {
                      const track = playableById.get(item.id);
                      if (track) {
                        remove(track.id);
                      }
                    }
                    toast.success(
                      items.length === 1
                        ? 'Removed 1 track.'
                        : `Removed ${items.length} tracks.`,
                    );
                  }}
                  compactActions
                />
              </div>
            )}
          </>
        ))}
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
        <>
          <TrackEditorDialog
            isOpen={editingIds !== null}
            onClose={() => setEditingIds(null)}
            library={nativeLibrary}
            ids={editingIds ?? []}
            onChanged={() => void refreshNative()}
          />
          <WriteTagsDialog
            isOpen={writingIds !== null}
            onClose={() => setWritingIds(null)}
            library={nativeLibrary}
            ids={writingIds ?? []}
            onChanged={() => void refreshNative()}
          />
          <OrganizeFilesDialog
            isOpen={organizingFilesIds !== null}
            onClose={() => setOrganizingFilesIds(null)}
            library={nativeLibrary}
            ids={organizingFilesIds ?? []}
            onChanged={() => void refreshNative()}
          />
          <TrackOrganizeDialog
            isOpen={organizingIds !== null}
            onClose={() => setOrganizingIds(null)}
            library={nativeLibrary}
            ids={organizingIds ?? []}
            onChanged={() => void refreshNative()}
          />
        </>
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

const MAX_LISTED_IMPORT_FAILURES = 5;

export function describeImportFailures(
  errors: ReadonlyArray<{ path: string; error: string }>,
): string {
  const lines = errors
    .slice(0, MAX_LISTED_IMPORT_FAILURES)
    .map((failure) => `${basename(failure.path)}: ${failure.error}`);
  const remaining = errors.length - lines.length;
  if (remaining > 0) {
    lines.push(`…and ${remaining} more.`);
  }
  return lines.join('\n');
}

function basename(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const segments = normalized.split('/');
  return segments[segments.length - 1] || path;
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
