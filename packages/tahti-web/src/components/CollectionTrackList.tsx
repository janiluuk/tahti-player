import { Link } from '@tanstack/react-router';

import { FavoriteButton, MediaArtwork } from '@tahti-player/ui';

import type { TahtiPlayable } from '../api/types';
import { generatedArtworkUrl } from '../lib/placeholderArt';
import { formatDuration } from '../lib/playableToTrack';
import { soundIdFromPlayableId } from '../lib/soundId';
import { useDominantColor } from '../lib/useDominantColor';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { AddToPlaylistButton } from './AddToPlaylistButton';
import { WaveformSeekbar } from './tahti/WaveformSeekbar';

const PLAYED_WAVE_COLOR = '#6CFF6B';
const UNPLAYED_WAVE_COLOR = 'rgba(255,255,255,0.78)';

function TrackRow({ item }: { item: TahtiPlayable }) {
  const play = usePlayerStore((s) => s.play);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const favorited = useLibraryStore((s) =>
    s.favoriteTracks.some((t) => t.id === item.id),
  );

  const isCurrent = currentId === item.id;
  const isPlaying = isCurrent && (status === 'playing' || status === 'loading');
  const totalDuration = (isCurrent ? duration : 0) || item.durationSec || 0;
  const elapsed = isCurrent ? currentTime : 0;
  const progress = isCurrent && totalDuration > 0 ? elapsed / totalDuration : 0;
  const soundId = soundIdFromPlayableId(item.id);
  const cover = item.coverUrl ?? generatedArtworkUrl(item.id);
  const rgb = useDominantColor(item.coverUrl);
  const ambient = rgb
    ? `radial-gradient(circle at 15% 0%, rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5), transparent 60%)`
    : undefined;

  const togglePlayback = () => {
    if (isCurrent) {
      setStatus(isPlaying ? 'paused' : 'playing');
      return;
    }
    play(item);
  };

  const seekFraction = (fraction: number) => {
    if (!isCurrent) {
      play(item);
      return;
    }
    if (totalDuration > 0) {
      seekTo(fraction * totalDuration);
    }
  };

  const title = soundId ? (
    <Link
      to="/t/$id"
      params={{ id: soundId }}
      className="hover:text-primary min-w-0 truncate font-semibold"
    >
      {item.title}
    </Link>
  ) : (
    <span className="min-w-0 truncate font-semibold">{item.title}</span>
  );

  return (
    <li className="relative overflow-hidden rounded-lg p-3">
      <div
        className="pointer-events-none absolute inset-0"
        style={ambient ? { backgroundImage: ambient } : undefined}
        aria-hidden
      />
      <img
        src={cover}
        alt=""
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-30 blur-2xl saturate-150"
        aria-hidden
      />
      <div className="bg-background/70 pointer-events-none absolute inset-0" />

      <div className="relative flex items-start gap-3">
        <MediaArtwork
          size="md"
          src={cover}
          alt=""
          className="border-border shrink-0 rounded-md border shadow-md"
          isPlaying={isPlaying}
          onPlay={togglePlayback}
          playLabel={`Play ${item.title}`}
          pauseLabel={`Pause ${item.title}`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            {title}
            <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
              {formatDuration(item.durationSec)}
            </span>
          </div>
          <WaveformSeekbar
            trackId={item.id}
            progress={progress}
            className="mt-2 h-10 sm:h-12"
            playedColor={PLAYED_WAVE_COLOR}
            unplayedColor={UNPLAYED_WAVE_COLOR}
            onSeek={seekFraction}
          />
          <div className="mt-1.5 flex items-center gap-1">
            {soundId ? (
              <AddToPlaylistButton soundId={soundId} trackTitle={item.title} />
            ) : null}
            <FavoriteButton
              size="sm"
              isFavorite={favorited}
              onToggle={() => toggleFavoriteTrack(item)}
              ariaLabelAdd="Favorite"
              ariaLabelRemove="Remove from favorites"
              title={favorited ? 'Remove from favorites' : 'Favorite'}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

/** Per-track waveform row list for a Set/Collection page — each track gets
 * its own scrubbable waveform and transport, rather than a single compact
 * table row. Reused as-is when a collection is opened from the artist
 * page, since that link routes into the same CollectionView. */
export function CollectionTrackList({ items }: { items: TahtiPlayable[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <TrackRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
