import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { i18n, type TFunction } from '@tahti-player/i18n';

import {
  bulkDeleteStudioSounds,
  bulkPatchStudioSounds,
  deleteStudioSound,
  fetchEditorSource,
  fetchStudioSoundDownload,
  fetchStudioSoundFacets,
  fetchStudioSoundIds,
  fetchStudioSoundsPage,
  fetchStudioSoundStats,
  patchStudioSound,
  STUDIO_SOUND_BULK_MAX_IDS,
  type StudioSoundBulkPatch,
  type StudioSoundListFilter,
  type StudioSoundStats,
} from '../../../api/studio';
import type { StudioSound } from '../../../api/studio-types';
import {
  resolveContentTypeId,
  selectableContentTypes,
  type ContentTypeId,
} from '../../../content/contentTypes';
import { playableFromStudioHearthis } from '../../../lib/embedPlayback';
import type { EmbedProvider } from '../../../lib/embedSrc';
import {
  countPinnedTracks,
  isPinned,
  sortPinnedFirst,
} from '../../../lib/pinnedTracks';
import { webT } from '../../../lib/webT';
import { usePlayerStore } from '../../../stores/playerStore';

export type EmbedFilter = 'ALL' | 'NATIVE' | EmbedProvider;
export type SortField = 'title' | 'uploaded' | 'duration';
export type ContentTypeFilter = 'ALL' | ContentTypeId;

export function embedFilters(
  t: TFunction<'web'>,
): Array<{ id: EmbedFilter; label: string }> {
  return [
    { id: 'ALL', label: t('useStudioSoundsState.allSources') },
    { id: 'NATIVE', label: 'Tahti audio' },
    { id: 'HEARTHIS', label: 'hearthis.at' },
    { id: 'MIXCLOUD', label: 'Mixcloud' },
    { id: 'SPOTIFY', label: 'Spotify' },
    { id: 'BANDCAMP', label: 'Bandcamp' },
    { id: 'MIKSERI', label: 'Mikseri.net' },
  ];
}

export function sortFields(
  t: TFunction<'web'>,
): Array<{ id: SortField; label: string }> {
  return [
    { id: 'title', label: t('useStudioSoundsState.title') },
    { id: 'uploaded', label: t('useStudioSoundsState.uploadDate') },
    { id: 'duration', label: t('useStudioSoundsState.duration') },
  ];
}

export function contentTypeFilters(t: TFunction<'web'>): Array<{
  id: ContentTypeFilter;
  label: string;
}> {
  return [
    { id: 'ALL', label: 'All types' },
    ...selectableContentTypes(t).map((type) => ({
      id: type.id,
      label: type.label,
    })),
  ];
}

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 200;

function parseContentTypeFilter(value: string | undefined): ContentTypeFilter {
  const resolved = resolveContentTypeId(value);
  if (!resolved) {
    return 'ALL';
  }
  if (selectableContentTypes(webT()).some((type) => type.id === resolved)) {
    return resolved;
  }
  return 'ALL';
}

function apiSort(
  field: SortField,
  descending: boolean,
): 'newest' | 'oldest' | 'title' | 'duration' {
  if (field === 'title') {
    return 'title';
  }
  if (field === 'duration') {
    return 'duration';
  }
  return descending ? 'newest' : 'oldest';
}

function toServerFilter(input: {
  query: string;
  contentTypeFilter: ContentTypeFilter;
  embedFilter: EmbedFilter;
  uploadedFrom: string;
  uploadedTo: string;
  genre?: string;
  tag?: string;
}): StudioSoundListFilter {
  return {
    ...(input.query.trim() ? { q: input.query.trim() } : {}),
    ...(input.contentTypeFilter !== 'ALL'
      ? { contentType: input.contentTypeFilter }
      : {}),
    ...(input.embedFilter === 'NATIVE'
      ? { source: 'native' }
      : input.embedFilter !== 'ALL'
        ? { source: input.embedFilter }
        : {}),
    ...(input.uploadedFrom ? { uploadedFrom: input.uploadedFrom } : {}),
    ...(input.uploadedTo ? { uploadedTo: input.uploadedTo } : {}),
    ...(input.genre ? { genre: input.genre } : {}),
    ...(input.tag ? { tag: input.tag } : {}),
  };
}

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
  const [tagFilter, setTagFilter] = useState('');
  const [facets, setFacets] = useState<{
    genre: Array<{ value: string; count: number }>;
    tag: Array<{ value: string; count: number }>;
  }>({ genre: [], tag: [] });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [embedOpenId, setEmbedOpenId] = useState<string | null>(null);
  const [statsItem, setStatsItem] = useState<StudioSound | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<StudioSound | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  /** True after “Select all matching”; bulk ops use filter + confirmTotal. */
  const [allMatchingSelected, setAllMatchingSelected] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const requestSeq = useRef(0);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);

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
        tag: tagFilter,
      }),
    [
      contentTypeFilter,
      debouncedQuery,
      embedFilter,
      uploadedFrom,
      uploadedTo,
      genreFilter,
      tagFilter,
    ],
  );

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }
    let active = true;
    void fetchStudioSoundFacets(['genre', 'tag']).then(({ data }) => {
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
      });
    });
    return () => {
      active = false;
    };
  }, [filtersOpen]);

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
    setGenreFilter('');
    setTagFilter('');
  };

  const filtersActive =
    Boolean(debouncedQuery.trim()) ||
    embedFilter !== 'ALL' ||
    contentTypeFilter !== 'ALL' ||
    Boolean(uploadedFrom) ||
    Boolean(uploadedTo) ||
    Boolean(genreFilter) ||
    Boolean(tagFilter);

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
  };

  const toggleSelected = (id: string) => {
    setAllMatchingSelected(false);
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

  const filterNarrows = Object.keys(serverFilter).length > 0;

  const buildBulkTarget = ():
    | { ids: string[] }
    | { filter: StudioSoundListFilter; confirmTotal: number; all?: boolean }
    | { error: string } => {
    if (allMatchingSelected) {
      return {
        filter: serverFilter,
        confirmTotal: total,
        ...(filterNarrows ? {} : { all: true as const }),
      };
    }
    const ids = [...selectedIds];
    if (ids.length === 0) {
      return { error: 'No sounds selected.' };
    }
    if (ids.length > STUDIO_SOUND_BULK_MAX_IDS) {
      return {
        error: `Select at most ${STUDIO_SOUND_BULK_MAX_IDS} sounds, or use “Select all matching” with a filter.`,
      };
    }
    return { ids };
  };

  const selectAllMatching = async () => {
    const seq = requestSeq.current;
    const filterSnapshot = serverFilter;
    setSelectingAll(true);
    try {
      const result = await fetchStudioSoundIds(filterSnapshot);
      if (seq !== requestSeq.current) {
        return;
      }
      if (result.meta.source === 'api' && result.meta.reason) {
        toast.error(result.meta.reason);
        return;
      }
      setSelectedIds(new Set(result.data.ids));
      setAllMatchingSelected(true);
      toast.success(
        i18n.t('web:toasts.soundsSelected', { count: result.data.total }),
      );
    } finally {
      if (seq === requestSeq.current) {
        setSelectingAll(false);
      }
    }
  };

  const confirmDelete = () => {
    const item = pendingDeleteItem;
    setPendingDeleteItem(null);
    if (!item) {
      return;
    }
    void (async () => {
      try {
        const result = await deleteStudioSound(item.id);
        if (result && 'ok' in result && !result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(i18n.t('web:toasts.deletedSound', { title: item.title }));
        setSelectedIds((prev) => {
          if (!prev.has(item.id)) {
            return prev;
          }
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setAllMatchingSelected(false);
        reload();
      } catch {
        toast.error(i18n.t('web:toasts.couldNotDeleteTrack'));
      }
    })();
  };

  const confirmBulkDelete = () => {
    setPendingBulkDelete(false);
    const target = buildBulkTarget();
    if ('error' in target) {
      toast.error(target.error);
      return;
    }
    if (bulkBusy) {
      return;
    }
    setBulkBusy(true);
    void (async () => {
      try {
        const result = await bulkDeleteStudioSounds(target);
        if (!result.ok) {
          toast.error(
            result.totalMatched !== undefined
              ? `${result.error} Refresh and try again.`
              : result.error,
          );
          return;
        }
        toast.success(
          i18n.t('web:toasts.deletedSounds', { count: result.data.deleted }),
        );
        clearSelection();
        reload();
      } finally {
        setBulkBusy(false);
      }
    })();
  };

  /** Titles for Add to release — covers select-all-matching beyond the loaded page. */
  const tracksForRelease = async (): Promise<
    Array<{ id: string; title: string }>
  > => {
    const titles = new Map(items.map((item) => [item.id, item.title] as const));
    const missing = [...selectedIds].filter((id) => !titles.has(id));
    if (missing.length > 0) {
      const pageSize = 50;
      let offset = 0;
      while (missing.some((id) => !titles.has(id)) && offset < total) {
        const page = await fetchStudioSoundsPage({
          ...serverFilter,
          sort: listSort,
          limit: pageSize,
          offset,
        });
        for (const item of page.data.items) {
          titles.set(item.id, item.title);
        }
        if (page.data.items.length === 0) {
          break;
        }
        offset += page.data.items.length;
      }
    }
    return [...selectedIds].map((id) => ({
      id,
      title: titles.get(id) ?? id,
    }));
  };

  const applyBulkEdit = (patch: StudioSoundBulkPatch) => {
    const target = buildBulkTarget();
    if ('error' in target) {
      toast.error(target.error);
      return;
    }
    if (bulkBusy) {
      return;
    }
    setBulkBusy(true);
    void (async () => {
      try {
        const result = await bulkPatchStudioSounds(
          'ids' in target ? { ids: target.ids, patch } : { ...target, patch },
        );
        if (!result.ok) {
          toast.error(
            result.totalMatched !== undefined
              ? `${result.error} Refresh and try again.`
              : result.error,
          );
          return;
        }
        toast.success(
          i18n.t('web:toasts.updatedSounds', { count: result.data.updated }),
        );
        setBulkEditOpen(false);
        reload();
      } finally {
        setBulkBusy(false);
      }
    })();
  };

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
    genreFilter,
    setGenreFilter,
    tagFilter,
    setTagFilter,
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
