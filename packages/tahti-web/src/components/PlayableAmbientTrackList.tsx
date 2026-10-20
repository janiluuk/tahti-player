import { Link } from '@tanstack/react-router';

import type { TahtiPlayable } from '../api/types';
import { formatDuration } from '../lib/playableToTrack';
import { soundIdFromPlayableId } from '../lib/soundId';
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
}: {
  items: TahtiPlayable[];
  emptyMessage?: string;
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

  const listItems: AmbientTrackListItem[] = items.map((item) => {
    const isCurrent = currentId === item.id;
    const isPlaying =
      isCurrent && (status === 'playing' || status === 'loading');
    const soundId = soundIdFromPlayableId(item.id);
    const rest = items.filter((other) => other.id !== item.id);
    return {
      id: item.id,
      trackId: item.id,
      title: item.title,
      titleNode: soundId ? (
        <Link to="/t/$id" params={{ id: soundId }} className="hover:underline">
          {item.title}
        </Link>
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
      renderList={() => (
        <PlayableTrackTable
          items={items}
          emptyMessage={emptyMessage}
          playAll={false}
        />
      )}
    />
  );
}
