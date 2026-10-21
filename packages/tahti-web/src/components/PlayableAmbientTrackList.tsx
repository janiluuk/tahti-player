import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { Select } from '@tahti-player/ui';

import type { TahtiPlayable } from '../api/types';
import { formatDuration } from '../lib/playableToTrack';
import { soundIdFromPlayableId } from '../lib/soundId';
import {
  sortTracks,
  TRACK_SORT_OPTIONS,
  useTrackSort,
  type TrackSort,
} from '../lib/trackSort';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import {
  AmbientTrackList,
  type AmbientTrackListItem,
} from './AmbientTrackList';
import { mockAmbientPeaks } from './AmbientTrackRow';
import { MediaIconActions, playQueueFavoriteActions } from './MediaIconActions';
import { PlayableTrackTable } from './PlayableTrackTable';

export function PlayableAmbientTrackList({
  items,
  emptyMessage = 'No tracks yet.',
  getAnnotation,
  compactActions,
  playAll = false,
}: {
  items: TahtiPlayable[];
  emptyMessage?: string;
  getAnnotation?: (item: TahtiPlayable) => ReactNode;
  compactActions?: boolean;
  playAll?: boolean;
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
  const [sort, setSort] = useTrackSort();
  const sorted = sortTracks(items, sort);

  const listItems: AmbientTrackListItem[] = sorted.map((item) => {
    const isCurrent = currentId === item.id;
    const isPlaying =
      isCurrent && (status === 'playing' || status === 'loading');
    const soundId = soundIdFromPlayableId(item.id);
    const rest = sorted.filter((other) => other.id !== item.id);
    const annotation = getAnnotation?.(item);
    return {
      id: item.id,
      trackId: item.id,
      title: item.title,
      titleNode: soundId ? (
        <Link to="/t/$id" params={{ id: soundId }} className="hover:underline">
          {item.title}
        </Link>
      ) : undefined,
      belowTitle: annotation ? (
        <div className="text-foreground-secondary text-xs">{annotation}</div>
      ) : undefined,
      artist: item.artist,
      coverUrl: item.coverUrl,
      durationLabel:
        item.durationSec != null ? formatDuration(item.durationSec) : undefined,
      peaks:
        item.peaks && item.peaks.length > 0
          ? item.peaks
          : mockAmbientPeaks(item.id.length),
      progress: isCurrent && duration > 0 ? currentTime / duration : 0,
      isPlaying,
      onPlay: () => {
        if (isCurrent) {
          setStatus(isPlaying ? 'paused' : 'playing');
          return;
        }
        play(item, { enqueueRest: rest });
      },
      onSeek:
        isCurrent && duration > 0
          ? (fraction) => seekTo(fraction * duration)
          : undefined,
      actions: (
        <MediaIconActions
          actions={playQueueFavoriteActions({
            onPlay: () => play(item, { enqueueRest: rest }),
            onQueue: () => enqueue(item),
            queued: queue.some((queued) => queued.id === item.id),
            onFavorite: () => toggleFavoriteTrack(item),
            favorited: favoriteTracks.some((fav) => fav.id === item.id),
          }).filter((action) => action.id !== 'play')}
        />
      ),
    };
  });

  return (
    <AmbientTrackList
      items={listItems}
      defaultDensity="compact"
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
        />
      )}
    />
  );
}
