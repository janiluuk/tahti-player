import { Link, useNavigate } from '@tanstack/react-router';
import { DownloadIcon, PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { FilterBar } from '@tahti-player/ui';

import type { TahtiPlayable } from '../api/types';
import { useTrackLikes } from '../hooks/useTrackLikes';
import { formatDuration } from '../lib/playableToTrack';
import { soundIdFromPlayableId } from '../lib/soundId';
import { titleWithoutArtist } from '../lib/titleWithoutArtist';
import { downloadTrackFromRow } from '../lib/trackDownload';
import { sortTracks, useTrackSort } from '../lib/trackSort';
import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';
import { useSoundLikesStore } from '../stores/soundLikesStore';
import { AddToPlaylistPanel } from './AddToPlaylistPanel';
import {
  AmbientTrackList,
  type AmbientTrackListItem,
  type AmbientTrackListView,
} from './AmbientTrackList';
import type {
  AmbientTrackRowDensity,
  AmbientTrackStats,
} from './AmbientTrackRow';
import {
  likeIconAction,
  MediaIconActions,
  playQueueFavoriteActions,
} from './MediaIconActions';
import { PageLoading } from './PageStates';
import { TrackSortButton } from './TrackSortButton';

// The table pulls @tanstack/table-core into whichever chunk imports it; lazy
// here keeps it out of the app shell that Listen (the index route) lives in.
const PlayableTrackTable = lazy(() =>
  import('./PlayableTrackTable').then((m) => ({
    default: m.PlayableTrackTable,
  })),
);

export function PlayableAmbientTrackList({
  items,
  emptyMessage,
  getAnnotation,
  compactActions,
  playAll = false,
  onEdit,
  onRemove,
  selectable = false,
  onBulkRemove,
  getTrackMeta,
  defaultDensity = 'compact',
  toolbarStart,
  filterable = false,
  allowGrid = true,
  initialView,
  heading,
  className,
}: {
  items: TahtiPlayable[];
  emptyMessage?: string;
  getAnnotation?: (item: TahtiPlayable) => ReactNode;
  compactActions?: boolean;
  playAll?: boolean;
  onEdit?: (item: TahtiPlayable) => void;
  /** Same contract as `PlayableTrackTable`'s: only for items the viewer
   * owns outright, removed without a confirmation dialog. */
  onRemove?: (item: TahtiPlayable) => void;
  /** Multi-select and bulk actions live in the List view. */
  selectable?: boolean;
  onBulkRemove?: (items: TahtiPlayable[]) => void;
  /** Genre and public totals for a track, when the page has them. Keep it
   * stable (useMemo / useCallback): the rows are memoized on it. */
  getTrackMeta?: (item: TahtiPlayable) =>
    | {
        genre?: string | null;
        stats?: AmbientTrackStats;
        trackNumber?: number;
        /** The artist allows downloads: the row offers a download action. */
        downloadable?: boolean;
      }
    | undefined;
  defaultDensity?: AmbientTrackRowDensity;
  /** Leads the toolbar row beside sort and size, e.g. a filter box. */
  toolbarStart?: ReactNode;
  /** Adds a search box that filters rows by title or artist. Ignored when
   * `toolbarStart` is set. */
  filterable?: boolean;
  /** Offers the cover-card grid view beside the list. */
  allowGrid?: boolean;
  /** Starting view for this list only, e.g. `list` for collections. */
  initialView?: AmbientTrackListView;
  /** Section title shown in the toolbar instead of the track count. */
  heading?: ReactNode;
  className?: string;
}) {
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  // One value, not currentTime and duration: a live stream (no duration)
  // then never re-renders the list on a progress tick.
  const progress = usePlayerStore((s) =>
    s.duration > 0 ? s.currentTime / s.duration : null,
  );
  const seekTo = usePlayerStore((s) => s.seekTo);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const navigate = useNavigate();
  const { t } = useTranslation('web');
  const resolvedEmptyMessage = emptyMessage ?? t('library.noTracksYet');
  const [playlistTarget, setPlaylistTarget] = useState<{
    soundId: string;
    title: string;
  } | null>(null);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const likedIds = useSoundLikesStore((s) => s.liked);
  const likeCounts = useSoundLikesStore((s) => s.counts);
  const toggleLike = useSoundLikesStore((s) => s.toggle);
  const { canLike, isLiked, toggleLike: toggleTrackLike } = useTrackLikes();
  const [sort, setSort] = useTrackSort();
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!filterable || !needle) {
      return items;
    }
    return items.filter((item) =>
      `${item.title} ${item.artist}`.toLocaleLowerCase().includes(needle),
    );
  }, [items, query, filterable]);
  const sorted = useMemo(() => sortTracks(filtered, sort), [filtered, sort]);
  const filterBox =
    filterable && items.length > 1 ? (
      <FilterBar
        searchValue={query}
        onSearchChange={setQuery}
        searchLabel={t('library.filterTracks')}
        searchPlaceholder={t('library.filterTracks')}
      />
    ) : undefined;
  const shownEmptyMessage =
    filterable && query.trim() && items.length > 0
      ? t('library.noTracksMatch', { query: query.trim() })
      : resolvedEmptyMessage;

  // Built without the playback position: a progress tick then only replaces
  // the current row, and the memoized rows skip re-rendering.
  const baseItems = useMemo(
    () =>
      sorted.map((item): AmbientTrackListItem => {
        const isCurrent = currentId === item.id;
        const isPlaying =
          isCurrent && (status === 'playing' || status === 'loading');
        const soundId = soundIdFromPlayableId(item.id);
        const rest = sorted.filter((other) => other.id !== item.id);
        const annotation = getAnnotation?.(item);
        const meta = getTrackMeta?.(item);
        const publicLikes = meta?.stats?.likes;
        const like =
          userId && soundId && item.channelSlug && publicLikes != null
            ? {
                liked: likedIds.has(soundId),
                count: likeCounts[soundId] ?? publicLikes,
                onToggle: () => {
                  void toggleLike(item.channelSlug!, soundId).then((error) => {
                    if (error) {
                      toast.error(error);
                    }
                  });
                },
              }
            : undefined;
        // Artist already has its own row field — drop a leading "Artist — " from the title.
        const displayTitle = titleWithoutArtist(item.title, item.artist);
        return {
          id: item.id,
          trackId: item.id,
          title: displayTitle,
          titleNode: soundId ? (
            <Link
              to="/t/$id"
              params={{ id: soundId }}
              className="hover:underline"
            >
              {displayTitle}
            </Link>
          ) : undefined,
          belowTitle: annotation ? (
            <div className="text-foreground-secondary text-xs">
              {annotation}
            </div>
          ) : undefined,
          artist: item.artist,
          coverUrl: item.coverUrl,
          durationLabel:
            item.durationSec != null
              ? formatDuration(item.durationSec)
              : undefined,
          durationSec: item.durationSec ?? null,
          genreLabel: meta?.genre ?? undefined,
          stats: meta?.stats,
          trackNumber: meta?.trackNumber,
          like,
          peaks: item.peaks ?? null,
          progress: 0,
          isPlaying,
          isCurrent,
          onPlay: () => {
            if (isCurrent) {
              setStatus(isPlaying ? 'paused' : 'playing');
              return;
            }
            play(item, { enqueueRest: rest });
          },
          onQueue: () => enqueue(item),
          actions: (
            <MediaIconActions
              actions={playQueueFavoriteActions({
                itemName: item.title,
                onPlay: () => play(item, { enqueueRest: rest }),
                onQueue: () => enqueue(item),
                queued: queue.some((queued) => queued.id === item.id),
              })
                .filter((action) => action.id !== 'play')
                .concat(
                  !like && canLike(item)
                    ? [
                        likeIconAction({
                          itemName: item.title,
                          liked: isLiked(item),
                          onToggle: () => toggleTrackLike(item),
                        }),
                      ]
                    : [],
                )
                .concat(
                  userId && soundId && item.kind === 'sound' && !item.embed
                    ? [
                        {
                          id: 'add-to-playlist',
                          label: t('actions.addToPlaylistItem', {
                            title: item.title,
                          }),
                          title: t('actions.addToPlaylist'),
                          icon: <PlusIcon size={16} />,
                          onClick: () =>
                            setPlaylistTarget({ soundId, title: item.title }),
                        },
                      ]
                    : [],
                )
                .concat(
                  meta?.downloadable && soundId && item.channelSlug
                    ? [
                        {
                          id: 'download',
                          label: t('actions.downloadItem', {
                            title: item.title,
                          }),
                          title: t('actions.download'),
                          icon: <DownloadIcon size={16} />,
                          onClick: () => {
                            void downloadTrackFromRow(
                              item.channelSlug!,
                              soundId,
                              item.title,
                            ).then((outcome) => {
                              if (outcome.kind === 'gated') {
                                toast.info(
                                  i18n.t(
                                    'web:batch51.followOrShareBeforeDownload',
                                  ),
                                );
                                void navigate({
                                  to: '/t/$id',
                                  params: { id: soundId },
                                });
                              } else if (outcome.kind === 'failed') {
                                toast.error(outcome.error);
                              }
                            });
                          },
                        },
                      ]
                    : [],
                )
                .concat(
                  onEdit
                    ? [
                        {
                          id: 'edit',
                          label: t('actions.edit'),
                          icon: <PencilIcon size={16} />,
                          onClick: () => onEdit(item),
                        },
                      ]
                    : [],
                )
                .concat(
                  onRemove
                    ? [
                        {
                          id: 'remove',
                          label: t('actions.removeItem', {
                            title: item.title,
                          }),
                          title: t('actions.remove'),
                          icon: (
                            <TrashIcon
                              className="text-accent-red-strong"
                              size={16}
                            />
                          ),
                          onClick: () => onRemove(item),
                        },
                      ]
                    : [],
                )}
            />
          ),
        };
      }),
    [
      sorted,
      currentId,
      status,
      queue,
      canLike,
      isLiked,
      toggleTrackLike,
      getAnnotation,
      getTrackMeta,
      userId,
      likedIds,
      likeCounts,
      toggleLike,
      navigate,
      onEdit,
      onRemove,
      play,
      enqueue,
      setStatus,
      t,
    ],
  );

  const listItems = useMemo(
    () =>
      progress != null
        ? baseItems.map((item) =>
            item.id === currentId
              ? {
                  ...item,
                  progress,
                  onSeek: (fraction: number) =>
                    seekTo(fraction * usePlayerStore.getState().duration),
                }
              : item,
          )
        : baseItems,
    [baseItems, currentId, progress, seekTo],
  );

  // One filter per list: the toolbar's when it has one, else the table's own.
  const tableFilterable = !filterBox && !toolbarStart;
  // The same element on every progress tick lets React skip the whole table.
  const listView = useMemo(
    () => (
      <Suspense fallback={<PageLoading label={t('loading.loading')} />}>
        <PlayableTrackTable
          items={sorted}
          emptyMessage={shownEmptyMessage}
          filterable={tableFilterable}
          playAll={playAll}
          compactActions={compactActions}
          getAnnotation={getAnnotation}
          onEdit={onEdit}
          onRemove={onRemove}
          selectable={selectable}
          onBulkRemove={onBulkRemove}
        />
      </Suspense>
    ),
    [
      t,
      sorted,
      shownEmptyMessage,
      tableFilterable,
      playAll,
      compactActions,
      getAnnotation,
      onEdit,
      onRemove,
      selectable,
      onBulkRemove,
    ],
  );

  return (
    <>
      <AmbientTrackList
        items={listItems}
        allowGrid={allowGrid}
        initialView={initialView}
        heading={heading}
        defaultDensity={defaultDensity}
        emptyMessage={shownEmptyMessage}
        toolbarStart={toolbarStart ?? filterBox}
        className={className}
        toolbarEnd={
          items.length > 1 ? (
            <TrackSortButton value={sort} onChange={setSort} />
          ) : undefined
        }
        renderList={() => listView}
      />
      {playlistTarget ? (
        <AddToPlaylistPanel
          isOpen
          soundId={playlistTarget.soundId}
          trackTitle={playlistTarget.title}
          onClose={() => setPlaylistTarget(null)}
        />
      ) : null}
    </>
  );
}
