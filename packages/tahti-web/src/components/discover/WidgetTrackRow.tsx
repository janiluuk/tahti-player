import { Link } from '@tanstack/react-router';
import { HeartIcon, MusicIcon } from 'lucide-react';
import { useState } from 'react';

import { MediaArtwork } from '@tahti-player/ui';

import { fetchTrackDetail } from '../../api/client';
import type { DiscoverTrackItem } from '../../api/types';
import { cn } from '../../lib/cn';
import { usePlayerStore } from '../../stores/playerStore';

function toPlayable(item: DiscoverTrackItem) {
  if (!item.audioUrl) {
    return null;
  }
  return {
    id: item.id,
    kind: 'sound' as const,
    title: item.title,
    artist: item.artist,
    coverUrl: item.coverUrl ?? undefined,
    streamUrl: item.audioUrl,
    protocol: item.audioUrl.includes('.m3u8')
      ? ('hls' as const)
      : ('https' as const),
    channelSlug: item.channelSlug,
  };
}

function matchesCurrentTrack(
  currentId: string | null,
  itemId: string,
): boolean {
  if (!currentId) {
    return false;
  }
  if (currentId === itemId) {
    return true;
  }
  const bareId = itemId.replace(/^sound:/, '');
  return currentId === bareId || currentId === `sound:${bareId}`;
}

export function WidgetTrackRow({
  item,
  rank,
  onSelect,
}: {
  item: DiscoverTrackItem;
  rank?: number;
  onSelect?: (item: DiscoverTrackItem) => void;
}) {
  const play = usePlayerStore((state) => state.play);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const currentId = usePlayerStore((state) => state.currentId);
  const status = usePlayerStore((state) => state.status);
  const [loading, setLoading] = useState(false);
  const playable = toPlayable(item);
  const isCurrent = matchesCurrentTrack(currentId, item.id);
  const isPlaying = isCurrent && status === 'playing';

  const handlePlay = async () => {
    if (isCurrent) {
      setStatus(isPlaying ? 'paused' : 'playing');
      return;
    }
    if (playable) {
      play(playable);
      return;
    }
    setLoading(true);
    const result = await fetchTrackDetail(item.id.replace(/^sound:/, ''));
    setLoading(false);
    const detail = result.data;
    if (!detail?.audioUrl) {
      return;
    }
    play({
      id: item.id,
      kind: 'sound',
      title: detail.title,
      artist: detail.artistName,
      coverUrl: detail.bannerUrl ?? undefined,
      streamUrl: detail.audioUrl,
      protocol: detail.audioUrl.includes('.m3u8') ? 'hls' : 'https',
      channelSlug: detail.channelSlug,
      durationSec: detail.durationSec,
    });
  };

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
          void handlePlay();
        }}
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
