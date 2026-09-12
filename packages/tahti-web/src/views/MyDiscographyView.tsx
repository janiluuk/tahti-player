import { Link } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  ChevronDownIcon,
  ImageIcon,
  PauseIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  PlayIcon,
  RadioTowerIcon,
  SearchIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FC } from 'react';

import {
  Button,
  FilterChips,
  ImageReveal,
  Input,
  Popover,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchEditorSource,
  fetchStudioSounds,
  patchStudioSound,
} from '../api/studio';
import type { StudioSound } from '../api/studio-types';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { WaveformSeekbar } from '../components/tahti/WaveformSeekbar';
import { TrackEditDialog } from '../components/TrackEditDialog';
import { playableFromStudioHearthis } from '../lib/embedPlayback';
import { EMBED_PROVIDER_LABEL } from '../lib/embedSrc';
import { isPinned, sortPinnedFirst } from '../lib/pinnedTracks';
import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';

type VisibilityFilter = 'all' | 'pinned' | 'private' | 'processing' | 'public';
type SortKey = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

const FILTERS: Array<{ id: VisibilityFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pinned', label: 'Pinned' },
  { id: 'private', label: 'Private' },
  { id: 'processing', label: 'Processing' },
  { id: 'public', label: 'Public' },
];

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'title-asc', label: 'Title A–Z' },
  { id: 'title-desc', label: 'Title Z–A' },
];

const itemFilter = (item: StudioSound): Exclude<VisibilityFilter, 'all'> => {
  if (item.status !== 'READY') {
    return 'processing';
  }
  return item.isPublic === false ? 'private' : 'public';
};

const sortItems = (items: StudioSound[], sort: SortKey) =>
  [...items].sort((first, second) => {
    if (sort === 'title-asc') {
      return first.title.localeCompare(second.title);
    }
    if (sort === 'title-desc') {
      return second.title.localeCompare(first.title);
    }
    const firstTime = new Date(first.createdAt ?? 0).getTime();
    const secondTime = new Date(second.createdAt ?? 0).getTime();
    return sort === 'oldest' ? firstTime - secondTime : secondTime - firstTime;
  });

export const MyDiscographyView: FC = () => {
  const user = useAuthStore((state) => state.user);
  const play = usePlayerStore((state) => state.play);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const seekTo = usePlayerStore((state) => state.seekTo);
  const currentId = usePlayerStore((state) => state.currentId);
  const status = usePlayerStore((state) => state.status);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const [items, setItems] = useState<StudioSound[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<VisibilityFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingSoundId, setEditingSoundId] = useState<string | null>(null);
  const [busyPinId, setBusyPinId] = useState<string | null>(null);
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    void fetchStudioSounds().then((result) => {
      setItems(result.data);
      // Production returns empty + error meta on failure (no mock fallback).
      // Surface that instead of looking like a genuinely empty library.
      setLoadError(
        result.meta.source === 'api' && result.meta.reason
          ? result.meta.reason
          : null,
      );
      setLoading(false);
    });
  };

  useEffect(reload, []);

  const sortLabel =
    SORT_OPTIONS.find((option) => option.id === sort)?.label ?? 'Sort';

  const counts = useMemo(
    () => ({
      all: items.length,
      pinned: items.filter(isPinned).length,
      private: items.filter((item) => itemFilter(item) === 'private').length,
      processing: items.filter((item) => itemFilter(item) === 'processing')
        .length,
      public: items.filter((item) => itemFilter(item) === 'public').length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (filter === 'pinned' && !isPinned(item)) {
        return false;
      }
      if (
        filter !== 'all' &&
        filter !== 'pinned' &&
        itemFilter(item) !== filter
      ) {
        return false;
      }
      return (
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.artistName?.toLowerCase().includes(normalizedQuery) ||
        item.genre?.toLowerCase().includes(normalizedQuery)
      );
    });
    return sortPinnedFirst(sortItems(filtered, sort));
  }, [filter, items, query, sort]);

  const playableId = (item: StudioSound) => `sound:${item.id}`;
  const isCurrentItem = (item: StudioSound) => currentId === playableId(item);
  const isPlayingItem = (item: StudioSound) =>
    isCurrentItem(item) && status === 'playing';

  const playItem = async (item: StudioSound) => {
    if (isCurrentItem(item)) {
      setStatus(status === 'playing' ? 'paused' : 'playing');
      return;
    }
    const hearthis = playableFromStudioHearthis(item);
    if (hearthis) {
      play(hearthis);
      return;
    }
    setLoadingId(item.id);
    const { data } = await fetchEditorSource(item.id);
    play({
      id: playableId(item),
      kind: 'sound',
      title: item.title,
      artist: item.artistName || user?.displayName || 'You',
      coverUrl: item.bannerUrl ?? undefined,
      streamUrl: data.url,
      protocol: data.url.includes('.m3u8') ? 'hls' : 'https',
    });
    setLoadingId(null);
  };

  const togglePin = async (item: StudioSound) => {
    const nextPinned = !isPinned(item);
    setPinMessage(null);
    setBusyPinId(item.id);
    const result = await patchStudioSound(item.id, {
      pinned: nextPinned,
    });
    setBusyPinId(null);
    if (!result.ok) {
      setPinMessage(result.error);
      return;
    }
    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? result.data : candidate,
      ),
    );
  };

  const hasChannel = Boolean(user?.channel);

  return (
    <div className="flex flex-col gap-8">
      {loading ? (
        <PageLoading label="Loading sounds…" />
      ) : loadError ? (
        <PageError
          title="Could not load sounds"
          description={loadError}
          onRetry={reload}
        />
      ) : !hasChannel && items.length === 0 ? (
        // Only show the "go live" nudge when there's genuinely nothing to
        // show — a channel-less state must never hide sounds the fetch
        // actually returned (e.g. a stale/late channel field on an
        // account that already has archive items).
        <PageEmpty
          title="No sounds yet"
          description="Go live or upload music to start your complete audio archive."
          action={
            <Link to="/studio/go-live">
              <Button size="sm" variant="secondary">
                <RadioTowerIcon size={16} aria-hidden className="mr-1.5" />
                Open Studio
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <div className="border-border bg-background-secondary/30 flex flex-col gap-3 rounded-xl border p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <FilterChips
                  items={FILTERS.map((option) => ({
                    id: option.id,
                    label: `${option.label} (${counts[option.id]})`,
                  }))}
                  selected={filter}
                  onChange={(id) => setFilter(id as VisibilityFilter)}
                  aria-label="Filter sounds"
                />
                <Popover
                  anchor="bottom end"
                  trigger={
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0 gap-1.5"
                    >
                      {sortLabel}
                      <ChevronDownIcon size={16} className="opacity-70" />
                    </Button>
                  }
                >
                  <Popover.Menu>
                    {SORT_OPTIONS.map((option) => (
                      <Popover.Item
                        key={option.id}
                        onClick={() => setSort(option.id)}
                      >
                        {option.label}
                      </Popover.Item>
                    ))}
                  </Popover.Menu>
                </Popover>
              </div>
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search all sounds…"
                aria-label="Search all sounds"
                className="w-full min-w-0"
                startAddon={
                  <SearchIcon size={14} aria-hidden className="opacity-70" />
                }
              />
              <p className="text-foreground-secondary text-xs">
                Pinned {counts.pinned} · showing {visible.length} of{' '}
                {items.length}
              </p>
            </div>

            {pinMessage ? (
              <p className="text-foreground-secondary text-sm" role="status">
                {pinMessage}
              </p>
            ) : null}

            {visible.length === 0 ? (
              <PageEmpty
                title={items.length === 0 ? 'No sounds yet' : 'No sounds match'}
                description={
                  items.length === 0
                    ? 'Upload or import audio to start your archive.'
                    : 'Change the search or filter to see more of your archive.'
                }
              />
            ) : (
              <ul className="border-border divide-border divide-y overflow-hidden rounded-xl border">
                {visible.map((item, index) => (
                  <li
                    key={item.id}
                    className={`hover:bg-primary/5 flex items-center gap-3 border-l-4 p-3 transition-colors ${
                      isPlayingItem(item)
                        ? 'border-l-primary bg-primary/10'
                        : isPinned(item)
                          ? 'border-l-primary bg-primary/10'
                          : `border-l-transparent ${index % 2 === 0 ? 'bg-background-secondary/55' : 'bg-background'}`
                    }`}
                  >
                    <div className="border-border bg-background-secondary flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                      <ImageReveal
                        src={item.bannerUrl ?? undefined}
                        alt=""
                        className="size-full"
                        placeholder={
                          <ImageIcon
                            size={18}
                            aria-hidden
                            className="text-foreground-secondary"
                          />
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/studio/sounds/$id"
                        params={{ id: item.id }}
                        className={`block truncate font-semibold hover:underline ${isPlayingItem(item) ? 'text-primary' : ''}`}
                      >
                        {item.title}
                      </Link>
                      <p className="text-foreground-secondary truncate text-xs">
                        {item.artistName || user?.displayName} ·{' '}
                        {itemFilter(item) === 'processing'
                          ? item.status
                          : itemFilter(item) === 'private'
                            ? 'Private'
                            : 'Public'}
                        {item.genre ? ` · ${item.genre}` : ''}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {isPinned(item) ? (
                          <span className="text-primary inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase">
                            <PinIcon size={11} aria-hidden /> Pinned to profile
                          </span>
                        ) : null}
                        {item.embedProvider ? (
                          <span className="border-border text-foreground-secondary inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                            Embed · {EMBED_PROVIDER_LABEL[item.embedProvider]}
                          </span>
                        ) : null}
                      </div>
                      {item.peaks && item.peaks.length > 0 ? (
                        <WaveformSeekbar
                          trackId={item.id}
                          peaks={item.peaks}
                          bars={48}
                          className="mt-1.5 h-4"
                          progress={
                            isCurrentItem(item) && duration > 0
                              ? currentTime / duration
                              : 0
                          }
                          onSeek={
                            isCurrentItem(item) && duration > 0
                              ? (fraction) => seekTo(fraction * duration)
                              : undefined
                          }
                        />
                      ) : null}
                    </div>
                    <Tooltip
                      content={`${isPinned(item) ? 'Unpin' : 'Pin'} ${item.title}`}
                      side="top"
                    >
                      <Button
                        size="icon-sm"
                        variant={isPinned(item) ? 'secondary' : 'text'}
                        disabled={busyPinId === item.id}
                        aria-label={`${isPinned(item) ? 'Unpin' : 'Pin'} ${item.title}`}
                        onClick={() => void togglePin(item)}
                      >
                        {isPinned(item) ? (
                          <PinOffIcon size={16} aria-hidden />
                        ) : (
                          <PinIcon size={16} aria-hidden />
                        )}
                      </Button>
                    </Tooltip>
                    <Tooltip
                      content={
                        isPlayingItem(item)
                          ? `Pause ${item.title}`
                          : `Play ${item.title}`
                      }
                      side="top"
                    >
                      <Button
                        size="icon-sm"
                        variant={isPlayingItem(item) ? 'default' : 'text'}
                        disabled={loadingId === item.id}
                        aria-label={
                          isPlayingItem(item)
                            ? `Pause ${item.title}`
                            : `Play ${item.title}`
                        }
                        onClick={() => void playItem(item)}
                      >
                        {isPlayingItem(item) ? (
                          <PauseIcon size={16} aria-hidden />
                        ) : (
                          <PlayIcon size={16} aria-hidden />
                        )}
                      </Button>
                    </Tooltip>
                    <Tooltip content={`Edit ${item.title}`} side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        aria-label={`Edit ${item.title}`}
                        onClick={() => setEditingSoundId(item.id)}
                      >
                        <PencilIcon size={16} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Link
                      to="/studio/sounds/$id/editor"
                      params={{ id: item.id }}
                    >
                      <Tooltip
                        content={`Open ${item.title} in audio editor`}
                        side="top"
                      >
                        <Button
                          size="icon-sm"
                          variant="text"
                          aria-label={`Open ${item.title} in audio editor`}
                        >
                          <AudioLinesIcon size={16} aria-hidden />
                        </Button>
                      </Tooltip>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <TrackEditDialog
        soundId={editingSoundId}
        onClose={() => setEditingSoundId(null)}
        onSaved={reload}
      />
    </div>
  );
};
