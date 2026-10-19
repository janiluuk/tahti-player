import { Link } from '@tanstack/react-router';
import { HeartIcon, MusicIcon } from 'lucide-react';

import { MediaArtwork } from '@tahti-player/ui';

import type { DiscoverTrackItem } from '../../api/types';
import { useDiscoverTrackPlayback } from '../../hooks/useDiscoverTrackPlayback';
import { cn } from '../../lib/cn';

export function WidgetTrackRow({
  item,
  rank,
  onSelect,
}: {
  item: DiscoverTrackItem;
  rank?: number;
  onSelect?: (item: DiscoverTrackItem) => void;
}) {
  const { isCurrent, isPlaying, loading, togglePlay, queue } =
    useDiscoverTrackPlayback(item);

  return (
    <Link
      to="/channel/$slug"
      params={{ slug: item.channelSlug }}
      onClick={
        onSelect
          ? (event) => {
              event.preventDefault();
              onSelect(item);
            }
          : undefined
      }
      className={cn(
        'hover:bg-background flex items-center gap-3 rounded px-1.5 py-1.5 transition-colors',
        isCurrent && 'bg-background-secondary/70',
      )}
    >
      {rank !== undefined && (
        <span className="text-foreground-secondary w-4 shrink-0 text-right text-xs tabular-nums">
          {rank}
        </span>
      )}
      <MediaArtwork
        size="thumb"
        src={item.coverUrl}
        alt=""
        className={cn('shrink-0 rounded', isCurrent && 'ring-primary ring-2')}
        imageReveal={Boolean(item.coverUrl)}
        isPlaying={isPlaying}
        playDisabled={loading}
        onPlay={() => {
          void togglePlay();
        }}
        onQueue={() => {
          void queue();
        }}
        queueLabel={`Add ${item.title} to queue`}
        playLabel={`Play ${item.title}`}
        pauseLabel={`Pause ${item.title}`}
        placeholder={
          <MusicIcon
            size={16}
            className="text-foreground-secondary"
            aria-hidden
          />
        }
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.title}</span>
        <span className="text-foreground-secondary block truncate text-xs">
          {item.artist}
        </span>
      </span>
      {item.listens !== undefined && (
        <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
          {item.listens.toLocaleString()} plays
        </span>
      )}
      {item.loves !== undefined && (
        <span className="text-foreground-secondary flex shrink-0 items-center gap-1 text-xs tabular-nums">
          <HeartIcon size={12} aria-hidden />
          {item.loves.toLocaleString()}
        </span>
      )}
    </Link>
  );
}
