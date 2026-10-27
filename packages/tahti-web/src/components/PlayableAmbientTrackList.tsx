import { Link, useNavigate } from '@tanstack/react-router';
import {
  DownloadIcon,
  ListPlusIcon,
  PencilIcon,
  TrashIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Select } from '@tahti-player/ui';

import type { TahtiPlayable } from '../api/types';
import { formatDuration } from '../lib/playableToTrack';
import { soundIdFromPlayableId } from '../lib/soundId';
import { downloadTrackFromRow } from '../lib/trackDownload';
import {
  sortTracks,
  TRACK_SORT_OPTIONS,
  useTrackSort,
  type TrackSort,
} from '../lib/trackSort';
import { useAuthStore } from '../stores/authStore';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { useSoundLikesStore } from '../stores/soundLikesStore';
import { AddToPlaylistPanel } from './AddToPlaylistPanel';
import {
  AmbientTrackList,
  type AmbientTrackListItem,
} from './AmbientTrackList';
import type {
  AmbientTrackRowDensity,
  AmbientTrackStats,
} from './AmbientTrackRow';
import { MediaIconActions, playQueueFavoriteActions } from './MediaIconActions';
import { PlayableTrackTable } from './PlayableTrackTable';

export function PlayableAmbientTrackList({
  items,
  emptyMessage = 'No tracks yet.',
  getAnnotation,
  compactActions,
  playAll = false,
  onEdit,
  onRemove,
  selectable = false,
  onBulkRemove,
  getTrackMeta,
  defaultDensity = 'compact',
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
        /** The artist allows downloads: the row offers a download action. */
        downloadable?: boolean;
      }
    | undefined;
  defaultDensity?: AmbientTrackRowDensity;
}) {
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const queue = usePlayerStore((s) => s.queue);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const favoriteTracks = useLibraryStore((s) => s.favoriteTracks);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const navigate = useNavigate();
  const [playlistTarget, setPlaylistTarget] = useState<{
    soundId: string;
    title: string;
  } | null>(null);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const likedIds = useSoundLikesStore((s) => s.liked);
  const likeCounts = useSoundLikesStore((s) => s.counts);
  const loadLikes = useSoundLikesStore((s) => s.load);
  const toggleLike = useSoundLikesStore((s) => s.toggle);
  useEffect(() => {
    if (userId && getTrackMeta) {
      void loadLikes(userId);
    }
  }, [userId, getTrackMeta, loadLikes]);
  const [sort, setSort] = useTrackSort();
  const sorted = useMemo(() => sortTracks(items, sort), [items, sort]);

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
        return {
          id: item.id,
          trackId: item.id,
          title: item.title,
          titleNode: soundId ? (
            <Link
              to="/t/$id"
              params={{ id: soundId }}
              className="hover:underline"
            >
              {item.title}
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
          like,
          peaks: item.peaks ?? null,
          progress: 0,
          isPlaying,
          onPlay: () => {
            if (isCurrent) {
              setStatus(isPlaying ? 'paused' : 'playing');
              return;
            }
            play(item, { enqueueRest: rest });
          },
          actions: (
            <MediaIconActions
              actions={playQueueFavoriteActions({
                onPlay: () => play(item, { enqueueRest: rest }),
                onQueue: () => enqueue(item),
                queued: queue.some((queued) => queued.id === item.id),
                onFavorite: () => toggleFavoriteTrack(item),
                favorited: favoriteTracks.some((fav) => fav.id === item.id),
              })
                .filter(
                  (action) =>
                    action.id !== 'play' && !(like && action.id === 'favorite'),
                )
                .concat(
                  userId && soundId && item.kind === 'sound' && !item.embed
                    ? [
                        {
                          id: 'add-to-playlist',
                          label: `Add ${item.title} to a playlist`,
                          title: 'Add to playlist',
                          icon: <ListPlusIcon size={16} />,
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
                          label: `Download ${item.title}`,
                          title: 'Download',
                          icon: <DownloadIcon size={16} />,
                          onClick: () => {
                            void downloadTrackFromRow(
                              item.channelSlug!,
                              soundId,
                              item.title,
                            ).then((outcome) => {
                              if (outcome.kind === 'gated') {
                                toast.info(
                                  'The artist asks you to follow or share before downloading.',
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
                          label: 'Edit',
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
                          label: `Remove ${item.title}`,
                          title: 'Remove',
                          icon: <TrashIcon size={16} />,
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
      favoriteTracks,
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
      toggleFavoriteTrack,
    ],
  );

  const listItems = useMemo(
    () =>
      duration > 0
        ? baseItems.map((item) =>
            item.id === currentId
              ? {
                  ...item,
                  progress: currentTime / duration,
                  onSeek: (fraction: number) => seekTo(fraction * duration),
                }
              : item,
          )
        : baseItems,
    [baseItems, currentId, currentTime, duration, seekTo],
  );

  return (
    <>
      <AmbientTrackList
        items={listItems}
        allowGrid
        defaultDensity={defaultDensity}
        emptyMessage={emptyMessage}
        toolbarEnd={
          items.length > 1 ? (
            <Select
              className="w-44"
              aria-label="Sort tracks"
              options={TRACK_SORT_OPTIONS}
              value={sort}
              onValueChange={(value) => setSort(value as TrackSort)}
            />
          ) : undefined
        }
        renderList={() => (
          <PlayableTrackTable
            items={sorted}
            emptyMessage={emptyMessage}
            playAll={playAll}
            compactActions={compactActions}
            getAnnotation={getAnnotation}
            onEdit={onEdit}
            onRemove={onRemove}
            selectable={selectable}
            onBulkRemove={onBulkRemove}
          />
        )}
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
