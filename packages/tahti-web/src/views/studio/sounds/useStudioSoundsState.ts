import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  deleteStudioSound,
  fetchEditorSource,
  fetchStudioSoundDownload,
  fetchStudioSounds,
  patchStudioSound,
} from '../../../api/studio';
import type { StudioSound } from '../../../api/studio-types';
import {
  resolveContentTypeId,
  SELECTABLE_CONTENT_TYPES,
  type ContentTypeId,
} from '../../../content/contentTypes';
import { playableFromStudioHearthis } from '../../../lib/embedPlayback';
import type { EmbedProvider } from '../../../lib/embedSrc';
import {
  countPinnedTracks,
  isPinned,
  sortPinnedFirst,
} from '../../../lib/pinnedTracks';
import { usePlayerStore } from '../../../stores/playerStore';

export type EmbedFilter = 'ALL' | 'NATIVE' | EmbedProvider;
export type SortField = 'title' | 'uploaded' | 'duration';
export type ContentTypeFilter = 'ALL' | ContentTypeId;

export const EMBED_FILTERS: Array<{ id: EmbedFilter; label: string }> = [
  { id: 'ALL', label: 'All sources' },
  { id: 'NATIVE', label: 'Tahti audio' },
  { id: 'HEARTHIS', label: 'hearthis.at' },
  { id: 'MIXCLOUD', label: 'Mixcloud' },
  { id: 'SPOTIFY', label: 'Spotify' },
  { id: 'BANDCAMP', label: 'Bandcamp' },
  { id: 'MIKSERI', label: 'Mikseri.net' },
];

export const SORT_FIELDS: Array<{ id: SortField; label: string }> = [
  { id: 'title', label: 'Title' },
  { id: 'uploaded', label: 'Upload date' },
  { id: 'duration', label: 'Duration' },
];

export const CONTENT_TYPE_FILTERS: Array<{
  id: ContentTypeFilter;
  label: string;
}> = [
  { id: 'ALL', label: 'All types' },
  ...SELECTABLE_CONTENT_TYPES.map((type) => ({
    id: type.id,
    label: type.label,
  })),
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseDateInput(value: string): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseContentTypeFilter(value: string | undefined): ContentTypeFilter {
  const resolved = resolveContentTypeId(value);
  if (!resolved) {
    return 'ALL';
  }
  if (SELECTABLE_CONTENT_TYPES.some((type) => type.id === resolved)) {
    return resolved;
  }
  return 'ALL';
}

/** Loading, filtering, sorting and row actions for the Sounds list. */
export function useStudioSoundsState() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    contentType?: string;
  };

  const [items, setItems] = useState<StudioSound[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [embedOpenId, setEmbedOpenId] = useState<string | null>(null);
  const [statsItem, setStatsItem] = useState<StudioSound | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<StudioSound | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);

  useEffect(() => {
    setContentTypeFilter(parseContentTypeFilter(search.contentType));
  }, [search.contentType]);

  const setContentTypeFilterAndUrl = (next: ContentTypeFilter) => {
    setContentTypeFilter(next);
    void navigate({
      to: '/library/sounds',
      search: next === 'ALL' ? {} : { contentType: next },
      replace: true,
    });
  };

  const reload = () => {
    setLoading(true);
    fetchStudioSounds()
      .then((res) => {
        setItems(res.data);
        setLoadError(
          res.meta.source === 'api' ? (res.meta.reason ?? null) : null,
        );
      })
      .catch(() => toast.error('Could not load your music.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

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
    const refresh = async () => {
      try {
        const result = await fetchStudioSounds();
        if (
          !cancelled &&
          !(result.meta.source === 'api' && result.meta.reason)
        ) {
          setItems((current) =>
            current.map(
              (item) =>
                result.data.find((updated) => updated.id === item.id) ?? item,
            ),
          );
        }
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
  }, [hasProcessing]);

  const clearFilters = () => {
    setQuery('');
    setEmbedFilter('ALL');
    setContentTypeFilterAndUrl('ALL');
    setUploadedFrom('');
    setUploadedTo('');
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = parseDateInput(uploadedFrom);
    const to = parseDateInput(uploadedTo);
    const toExclusive = to ? new Date(to.getTime() + DAY_IN_MS) : null;
    const base = !q
      ? items
      : items.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            (i.genre?.toLowerCase().includes(q) ?? false) ||
            i.status.toLowerCase().includes(q) ||
            (i.contentType?.toLowerCase().includes(q) ?? false),
        );
    const filteredItems = base.filter((item) => {
      if (
        contentTypeFilter !== 'ALL' &&
        resolveContentTypeId(item.contentType) !== contentTypeFilter
      ) {
        return false;
      }
      const provider = item.embedProvider ?? 'NATIVE';
      if (embedFilter !== 'ALL' && provider !== embedFilter) {
        return false;
      }
      if (!item.createdAt) {
        return !from && !toExclusive;
      }
      const uploadedAt = new Date(item.createdAt);
      if (Number.isNaN(uploadedAt.getTime())) {
        return !from && !toExclusive;
      }
      return (
        (!from || uploadedAt >= from) &&
        (!toExclusive || uploadedAt < toExclusive)
      );
    });
    return sortPinnedFirst(filteredItems).sort((left, right) => {
      const comparison =
        sortField === 'title'
          ? left.title.localeCompare(right.title)
          : sortField === 'duration'
            ? (left.durationSec ?? 0) - (right.durationSec ?? 0)
            : new Date(left.createdAt ?? 0).getTime() -
              new Date(right.createdAt ?? 0).getTime();
      return sortDescending ? -comparison : comparison;
    });
  }, [
    contentTypeFilter,
    embedFilter,
    items,
    query,
    sortDescending,
    sortField,
    uploadedFrom,
    uploadedTo,
  ]);

  const pinnedCount = countPinnedTracks(items);

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

  const toggleSelected = (id: string) => {
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
        toast.success(`Deleted “${item.title}”.`);
        reload();
      } catch {
        toast.error('Could not delete the track.');
      }
    })();
  };

  return {
    items,
    setItems,
    query,
    setQuery,
    loading,
    loadError,
    clearFilters,
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
    busyId,
    editingId,
    setEditingId,
    embedOpenId,
    statsItem,
    setStatsItem,
    pendingDeleteItem,
    setPendingDeleteItem,
    reload,
    filtered,
    pinnedCount,
    playItem,
    playEmbedItem,
    downloadItem,
    togglePin,
    confirmDelete,
    selectedIds,
    setSelectedIds,
    toggleSelected,
  };
}

export type StudioSoundsState = ReturnType<typeof useStudioSoundsState>;
