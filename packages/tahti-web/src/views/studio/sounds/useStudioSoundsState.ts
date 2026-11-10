import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

import {
  fetchEditorSource,
  fetchStudioSoundDownload,
  fetchStudioSoundFacets,
  fetchStudioSoundsPage,
  fetchStudioSoundStats,
  patchStudioSound,
  type StudioSoundStats,
} from '../../../api/studio';
import type { StudioSound } from '../../../api/studio-types';
import { playableFromStudioHearthis } from '../../../lib/embedPlayback';
import {
  countPinnedTracks,
  isPinned,
  sortPinnedFirst,
} from '../../../lib/pinnedTracks';
import { usePlayerStore } from '../../../stores/playerStore';
import { useTrackListViewStore } from '../../../stores/trackListViewStore';
import {
  createStudioSoundsBulkActions,
  type BulkConfirmMismatch,
} from './studioSoundsBulkActions';
import {
  apiSort,
  parseContentTypeFilter,
  toServerFilter,
  yearBounds,
  type ContentTypeFilter,
  type EmbedFilter,
  type FallbackFilter,
  type PinnedFilter,
  type SortField,
  type StatusFilter,
  type VisibilityFilter,
} from './studioSoundsFilters';

export type {
  ContentTypeFilter,
  EmbedFilter,
  FallbackFilter,
  PinnedFilter,
  SortField,
  StatusFilter,
  VisibilityFilter,
} from './studioSoundsFilters';
export {
  contentTypeFilters,
  embedFilters,
  sortFields,
} from './studioSoundsFilters';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 200;

/** Loading, filtering, sorting and row actions for the Sounds list. */
export function useStudioSoundsState() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    contentType?: string;
  };

  const [items, setItems] = useState<StudioSound[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<StudioSoundStats | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [embedFilter, setEmbedFilter] = useState<EmbedFilter>('ALL');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>(
    () => parseContentTypeFilter(search.contentType),
  );
  const [sortField, setSortField] = useState<SortField>('uploaded');
  const [sortDescending, setSortDescending] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [uploadedFrom, setUploadedFrom] = useState('');
  const [uploadedTo, setUploadedTo] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [bpmMin, setBpmMin] = useState('');
  const [bpmMax, setBpmMax] = useState('');
  const [keyFilter, setKeyFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>('ALL');
  const [pinnedFilter, setPinnedFilter] = useState<PinnedFilter>('ALL');
  const [fallbackFilter, setFallbackFilter] = useState<FallbackFilter>('ALL');
  const [facets, setFacets] = useState<{
    genre: Array<{ value: string; count: number }>;
    tag: Array<{ value: string; count: number }>;
    contentType: Array<{ value: string; count: number }>;
    source: Array<{ value: string; count: number }>;
    status: Array<{ value: string; count: number }>;
    uploadedYear: Array<{ value: string; count: number }>;
    musicalKey: Array<{ value: string; count: number }>;
  }>({
    genre: [],
    tag: [],
    contentType: [],
    source: [],
    status: [],
    uploadedYear: [],
    musicalKey: [],
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [embedOpenId, setEmbedOpenId] = useState<string | null>(null);
  const [statsItem, setStatsItem] = useState<StudioSound | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<StudioSound | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [bulkConfirmMismatch, setBulkConfirmMismatch] =
    useState<BulkConfirmMismatch | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allMatchingSelected, setAllMatchingSelected] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [coversBusy, setCoversBusy] = useState(false);
  const requestSeq = useRef(0);
  const selectionAnchorId = useRef<string | null>(null);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const listView = useTrackListViewStore((store) => store.view);

  useEffect(() => {
    setContentTypeFilter(parseContentTypeFilter(search.contentType));
  }, [search.contentType]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const setContentTypeFilterAndUrl = (next: ContentTypeFilter) => {
    setContentTypeFilter(next);
    void navigate({
      to: '/library/sounds',
      search: next === 'ALL' ? {} : { contentType: next },
      replace: true,
    });
  };

  const serverFilter = useMemo(
    () =>
      toServerFilter({
        query: debouncedQuery,
        contentTypeFilter,
        embedFilter,
        uploadedFrom,
        uploadedTo,
        genre: genreFilter,
        tags: tagFilters,
        bpmMin,
        bpmMax,
        key: keyFilter,
        statusFilter,
        visibilityFilter,
        pinnedFilter,
        fallbackFilter,
      }),
    [
      contentTypeFilter,
      debouncedQuery,
      embedFilter,
      uploadedFrom,
      uploadedTo,
      genreFilter,
      tagFilters,
      bpmMin,
      bpmMax,
      keyFilter,
      statusFilter,
      visibilityFilter,
      pinnedFilter,
      fallbackFilter,
    ],
  );

  useEffect(() => {
    let active = true;
    void fetchStudioSoundFacets(
      [
        'genre',
        'tag',
        'contentType',
        'source',
        'status',
        'uploadedYear',
        'musicalKey',
      ],
      serverFilter,
    ).then(({ data }) => {
      if (!active) {
        return;
      }
      const sorted = (values: Array<{ value: string; count: number }> = []) =>
        [...values].sort(
          (a, b) => b.count - a.count || a.value.localeCompare(b.value),
        );
      setFacets({
        genre: sorted(data.facets.genre),
        tag: sorted(data.facets.tag),
        contentType: sorted(data.facets.contentType),
        source: sorted(data.facets.source),
        status: sorted(data.facets.status),
        uploadedYear: sorted(data.facets.uploadedYear),
        musicalKey: sorted(data.facets.musicalKey),
      });
    });
    return () => {
      active = false;
    };
  }, [serverFilter]);

  const listSort = apiSort(sortField, sortDescending);

  const reload = (opts?: { offset?: number; append?: boolean }) => {
    const offset = opts?.offset ?? 0;
    const append = opts?.append ?? false;
    const seq = ++requestSeq.current;
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    void Promise.all([
      fetchStudioSoundsPage({
        ...serverFilter,
        sort: listSort,
        limit: PAGE_SIZE,
        offset,
      }),
      fetchStudioSoundStats(serverFilter),
    ])
      .then(([pageRes, statsRes]) => {
        if (seq !== requestSeq.current) {
          return;
        }
        setItems((current) =>
          append ? [...current, ...pageRes.data.items] : pageRes.data.items,
        );
        setTotal(pageRes.data.total);
        setStats(statsRes.data);
        setLoadError(
          pageRes.meta.source === 'api' ? (pageRes.meta.reason ?? null) : null,
        );
      })
      .catch(() => {
        if (seq !== requestSeq.current) {
          return;
        }
        toast.error(i18n.t('web:toasts.couldNotLoadMusic'));
      })
      .finally(() => {
        if (seq !== requestSeq.current) {
          return;
        }
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    setSelectedIds(new Set());
    setAllMatchingSelected(false);
    reload();
  }, [serverFilter, listSort]);

  const hasProcessing = items.some(
    (item) =>
      !item.embedProvider &&
      (item.status === 'PENDING' || item.status === 'PROCESSING'),
  );
  useEffect(() => {
    if (!hasProcessing) {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const pollSeq = requestSeq.current;
    const refresh = async () => {
      try {
        const result = await fetchStudioSoundsPage({
          ...serverFilter,
          sort: listSort,
          limit: Math.max(items.length, PAGE_SIZE),
          offset: 0,
        });
        if (
          cancelled ||
          pollSeq !== requestSeq.current ||
          (result.meta.source === 'api' && result.meta.reason)
        ) {
          return;
        }
        setItems(result.data.items);
        setTotal(result.data.total);
      } catch {
        return;
      } finally {
        if (!cancelled) {
          timer = setTimeout(() => {
            void refresh();
          }, 5000);
        }
      }
    };
    timer = setTimeout(() => {
      void refresh();
    }, 5000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hasProcessing, items.length, listSort, serverFilter]);

  const clearFilters = () => {
    setQuery('');
    setEmbedFilter('ALL');
    if (contentTypeFilter !== 'ALL') {
      setContentTypeFilterAndUrl('ALL');
    }
    setUploadedFrom('');
    setUploadedTo('');
    setYearFilter('');
    setGenreFilter('');
    setTagFilters([]);
    setBpmMin('');
    setBpmMax('');
    setKeyFilter('');
    setStatusFilter('ALL');
    setVisibilityFilter('ALL');
    setPinnedFilter('ALL');
    setFallbackFilter('ALL');
    setSelectionNotice(null);
  };

  const setUploadedYearFilter = (year: string) => {
    if (!year) {
      setYearFilter('');
      setUploadedFrom('');
      setUploadedTo('');
      return;
    }
    setYearFilter(year);
    const bounds = yearBounds(year);
    setUploadedFrom(bounds.uploadedFrom);
    setUploadedTo(bounds.uploadedTo);
  };

  const clearYearLabel = () => {
    setYearFilter('');
  };

  const addTagFilter = (tag: string) => {
    const next = tag.trim();
    if (!next) {
      return;
    }
    setTagFilters((current) =>
      current.includes(next) ? current : [...current, next],
    );
  };

  const removeTagFilter = (tag: string) => {
    setTagFilters((current) => current.filter((value) => value !== tag));
  };

  const filtersActive =
    Boolean(debouncedQuery.trim()) ||
    embedFilter !== 'ALL' ||
    contentTypeFilter !== 'ALL' ||
    Boolean(uploadedFrom) ||
    Boolean(uploadedTo) ||
    Boolean(yearFilter) ||
    Boolean(genreFilter) ||
    tagFilters.length > 0 ||
    Boolean(bpmMin.trim()) ||
    Boolean(bpmMax.trim()) ||
    Boolean(keyFilter.trim()) ||
    statusFilter !== 'ALL' ||
    visibilityFilter !== 'ALL' ||
    pinnedFilter !== 'ALL' ||
    fallbackFilter !== 'ALL';

  const filtered = useMemo(() => {
    const ordered = sortPinnedFirst(items);
    if (sortField === 'title' && sortDescending) {
      return [...ordered].reverse();
    }
    if (sortField === 'duration' && !sortDescending) {
      return [...ordered].reverse();
    }
    return ordered;
  }, [items, sortDescending, sortField]);

  const pinnedCount = countPinnedTracks(items);
  const hasMore = items.length < total;

  const loadMore = () => {
    if (loadingMore || !hasMore) {
      return;
    }
    reload({ offset: items.length, append: true });
  };

  const playItem = async (
    id: string,
    title: string,
    opts?: { queue?: boolean },
  ) => {
    setBusyId(id);
    const { data } = await fetchEditorSource(id);
    const playable = {
      id: `sound:${id}`,
      kind: 'sound' as const,
      title: data.title || title,
      artist: 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8')
        ? ('hls' as const)
        : ('https' as const),
    };
    if (opts?.queue) {
      enqueue(playable);
    } else {
      play(playable);
    }
    setBusyId(null);
  };

  const playEmbedItem = (item: StudioSound, opts?: { queue?: boolean }) => {
    const hearthis = playableFromStudioHearthis(item);
    if (hearthis) {
      if (opts?.queue) {
        enqueue(hearthis);
      } else {
        play(hearthis);
        setEmbedOpenId(null);
      }
      return;
    }
    if (opts?.queue) {
      return;
    }
    setEmbedOpenId((id) => (id === item.id ? null : item.id));
  };

  const downloadItem = async (item: StudioSound) => {
    setBusyId(item.id);
    const result = await fetchStudioSoundDownload(item.id);
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.filename ?? `${item.title}.audio`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const togglePin = async (item: StudioSound) => {
    const next = !isPinned(item);
    setBusyId(item.id);
    const result = await patchStudioSound(item.id, { pinned: next });
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? result.data : row)),
    );
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setAllMatchingSelected(false);
    setSelectionNotice(null);
  };

  // Selection checkboxes only exist in list view — drop the set when leaving it.
  useEffect(() => {
    if (listView !== null && listView !== 'list') {
      setSelectedIds(new Set());
      setAllMatchingSelected(false);
    }
  }, [listView]);

  const orderedSelectableIds = () =>
    (filtered.length > 0 ? filtered : items).map((item) => item.id);

  const toggleSelected = (id: string, opts?: { shift?: boolean }) => {
    setAllMatchingSelected(false);
    const ordered = orderedSelectableIds();
    if (opts?.shift && selectionAnchorId.current) {
      const start = ordered.indexOf(selectionAnchorId.current);
      const end = ordered.indexOf(id);
      if (start >= 0 && end >= 0) {
        const [from, to] = start < end ? [start, end] : [end, start];
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (let index = from; index <= to; index += 1) {
            const rowId = ordered[index];
            if (rowId) {
              next.add(rowId);
            }
          }
          return next;
        });
        return;
      }
    }
    selectionAnchorId.current = id;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const {
    selectAllMatching,
    confirmDelete,
    confirmBulkDelete,
    confirmBulkMismatch,
    applyBulkEdit,
    tracksForRelease,
    backfillCovers,
  } = createStudioSoundsBulkActions({
    bulkBusy,
    setBulkBusy,
    coversBusy,
    setCoversBusy,
    serverFilter,
    total,
    items,
    selectedIds,
    allMatchingSelected,
    setSelectedIds,
    setAllMatchingSelected,
    setSelectingAll,
    setSelectionNotice,
    setPendingBulkDelete,
    setBulkConfirmMismatch,
    setBulkEditOpen,
    bulkConfirmMismatch,
    pendingDeleteItem,
    setPendingDeleteItem,
    requestSeq,
    listSort,
    clearSelection,
    reload: () => reload(),
  });

  return {
    items,
    setItems,
    total,
    stats,
    query,
    setQuery,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    loadError,
    clearFilters,
    filtersActive,
    embedFilter,
    setEmbedFilter,
    contentTypeFilter,
    setContentTypeFilter: setContentTypeFilterAndUrl,
    sortField,
    setSortField,
    sortDescending,
    setSortDescending,
    filtersOpen,
    setFiltersOpen,
    uploadedFrom,
    setUploadedFrom,
    uploadedTo,
    setUploadedTo,
    yearFilter,
    setUploadedYearFilter,
    clearYearLabel,
    genreFilter,
    setGenreFilter,
    tagFilters,
    addTagFilter,
    removeTagFilter,
    bpmMin,
    setBpmMin,
    bpmMax,
    setBpmMax,
    keyFilter,
    setKeyFilter,
    statusFilter,
    setStatusFilter,
    visibilityFilter,
    setVisibilityFilter,
    pinnedFilter,
    setPinnedFilter,
    fallbackFilter,
    setFallbackFilter,
    selectionNotice,
    facets,
    busyId,
    editingId,
    setEditingId,
    embedOpenId,
    statsItem,
    setStatsItem,
    pendingDeleteItem,
    setPendingDeleteItem,
    pendingBulkDelete,
    setPendingBulkDelete,
    bulkConfirmMismatch,
    setBulkConfirmMismatch,
    confirmBulkMismatch,
    bulkEditOpen,
    setBulkEditOpen,
    reload: () => reload(),
    filtered,
    pinnedCount,
    playItem,
    playEmbedItem,
    downloadItem,
    togglePin,
    confirmDelete,
    confirmBulkDelete,
    applyBulkEdit,
    selectAllMatching,
    selectingAll,
    bulkBusy,
    coversBusy,
    backfillCovers,
    allMatchingSelected,
    clearSelection,
    tracksForRelease,
    serverFilter,
    selectedIds,
    setSelectedIds,
    toggleSelected,
  };
}

export type StudioSoundsState = ReturnType<typeof useStudioSoundsState>;
