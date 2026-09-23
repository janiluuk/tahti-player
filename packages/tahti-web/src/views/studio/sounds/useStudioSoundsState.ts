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
import { playableFromStudioHearthis } from '../../../lib/embedPlayback';
import type { EmbedProvider } from '../../../lib/embedSrc';
import {
  countPinnedTracks,
  isPinned,
  sortPinnedFirst,
} from '../../../lib/pinnedTracks';
import { usePlayerStore } from '../../../stores/playerStore';

export const FOLDERS = ['sound', 'clips', 'files'] as const;

export type EmbedFilter = 'ALL' | 'NATIVE' | EmbedProvider;
export type SortField = 'title' | 'uploaded' | 'duration';

export const EMBED_FILTERS: Array<{ id: EmbedFilter; label: string }> = [
  { id: 'ALL', label: 'All sources' },
  { id: 'NATIVE', label: 'Tahti audio' },
  { id: 'HEARTHIS', label: 'hearthis.at' },
  { id: 'MIXCLOUD', label: 'Mixcloud' },
  { id: 'SPOTIFY', label: 'Spotify' },
  { id: 'BANDCAMP', label: 'Bandcamp' },
];

export const SORT_FIELDS: Array<{ id: SortField; label: string }> = [
  { id: 'title', label: 'Title' },
  { id: 'uploaded', label: 'Upload date' },
  { id: 'duration', label: 'Duration' },
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseDateInput(value: string): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Loading, filtering, sorting and row actions for the Tracks list. */
export function useStudioSoundsState() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { folder?: string };
  const folder =
    search.folder === 'files'
      ? 'files'
      : search.folder === 'clips'
        ? 'clips'
        : 'sound';
  const [items, setItems] = useState<StudioSound[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [embedFilter, setEmbedFilter] = useState<EmbedFilter>('ALL');
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
  const play = usePlayerStore((s) => s.play);

  const reload = () => {
    setLoading(true);
    fetchStudioSounds()
      .then((res) => setItems(res.data))
      .catch(() => toast.error('Could not load your music.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const setTabFolder = (index: number) => {
    const next = FOLDERS[index];
    if (!next) {
      return;
    }
    void navigate({
      to: '/studio/sounds',
      search: next === 'sound' ? {} : { folder: next },
    });
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
            i.status.toLowerCase().includes(q),
        );
    const filteredItems = base.filter((item) => {
      if (folder === 'clips' && item.contentType !== 'CLIP') {
        return false;
      }
      if (folder === 'sound' && item.contentType === 'CLIP') {
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
    embedFilter,
    items,
    query,
    sortDescending,
    sortField,
    uploadedFrom,
    uploadedTo,
    folder,
  ]);

  const pinnedCount = countPinnedTracks(items);

  const playItem = async (id: string, title: string) => {
    setBusyId(id);
    const { data } = await fetchEditorSource(id);
    play({
      id: `sound:${id}`,
      kind: 'sound',
      title: data.title || title,
      artist: 'You',
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    });
    setBusyId(null);
  };

  const playEmbedItem = (item: StudioSound) => {
    const hearthis = playableFromStudioHearthis(item);
    if (hearthis) {
      play(hearthis);
      setEmbedOpenId(null);
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
    folder,
    setTabFolder,
    items,
    setItems,
    query,
    setQuery,
    loading,
    embedFilter,
    setEmbedFilter,
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
  };
}

export type StudioSoundsState = ReturnType<typeof useStudioSoundsState>;
