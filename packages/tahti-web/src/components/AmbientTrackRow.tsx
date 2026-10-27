import {
  CirclePlayIcon,
  DownloadIcon,
  HeartIcon,
  PauseIcon,
  PlayIcon,
} from 'lucide-react';
import { memo, type ReactNode } from 'react';

import { Badge, Button, MediaArtwork, Tooltip } from '@tahti-player/ui';

import { cn } from '../lib/cn';
import { useDominantColor } from '../lib/useDominantColor';
import { WaveformSeekbar } from './tahti/WaveformSeekbar';

function ambientStyle(
  rgb: [number, number, number] | null,
): { backgroundImage: string } | undefined {
  if (!rgb) {
    return undefined;
  }
  const [r, g, b] = rgb;
  return {
    backgroundImage: `linear-gradient(90deg, rgba(${r}, ${g}, ${b}, 0.42), rgba(${r}, ${g}, ${b}, 0.12) 45%, transparent 85%)`,
  };
}

export type AmbientTrackRowDensity = 'comfortable' | 'compact' | 'dense';

const DENSITY_LAYOUT: Record<
  AmbientTrackRowDensity,
  {
    pad: string;
    gap: string;
    art: 'sm' | 'thumb' | 'md';
    artClass?: string;
    play: string;
    playIcon: number;
    artist: string;
    title: string;
    meta: string;
    bars: number;
    wave: string;
  }
> = {
  comfortable: {
    pad: 'gap-4 p-4',
    gap: 'gap-2',
    art: 'md',
    artClass: 'size-20 min-w-20 sm:size-28 sm:min-w-28',
    play: 'size-11 border-2',
    playIcon: 20,
    artist: 'text-sm',
    title: 'text-lg sm:text-xl',
    meta: 'text-xs',
    bars: 96,
    wave: 'h-14',
  },
  compact: {
    pad: 'gap-2 p-2',
    gap: 'gap-1',
    art: 'thumb',
    play: 'size-8 border-2',
    playIcon: 14,
    artist: 'text-[11px]',
    title: 'text-sm',
    meta: 'text-[11px]',
    bars: 48,
    wave: 'h-6',
  },
  dense: {
    pad: 'gap-2 px-2 py-1.5',
    gap: 'gap-0.5',
    art: 'sm',
    play: 'size-7 border',
    playIcon: 12,
    artist: 'text-[10px]',
    title: 'text-xs',
    meta: 'text-[10px]',
    bars: 36,
    wave: 'h-4',
  },
};

export type AmbientTrackStats = {
  releaseDate?: string | null;
  likes?: number;
  plays?: number;
  downloads?: number;
};

function formatStatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function TrackStats({
  stats,
  className,
}: {
  stats: AmbientTrackStats;
  className: string;
}) {
  const parts: ReactNode[] = [];
  if (stats.releaseDate) {
    parts.push(<span key="date">on {formatStatDate(stats.releaseDate)}</span>);
  }
  const counts: Array<[string, number | undefined, ReactNode, string]> = [
    ['likes', stats.likes, <HeartIcon size={14} aria-hidden />, 'likes'],
    ['plays', stats.plays, <CirclePlayIcon size={14} aria-hidden />, 'plays'],
    [
      'downloads',
      stats.downloads,
      <DownloadIcon size={14} aria-hidden />,
      'downloads',
    ],
  ];
  for (const [key, value, icon, noun] of counts) {
    if (value != null) {
      parts.push(
        <span
          key={key}
          className="inline-flex items-center gap-1"
          aria-label={`${value} ${noun}`}
        >
          {icon}
          <span aria-hidden>{value.toLocaleString()}</span>
        </span>,
      );
    }
  }
  if (parts.length === 0) {
    return null;
  }
  return (
    <div
      className={cn(
        'text-foreground-secondary ml-auto flex flex-wrap items-center gap-3 tabular-nums',
        className,
      )}
      data-testid="ambient-track-stats"
    >
      {parts}
    </div>
  );
}

export type AmbientTrackLike = {
  liked: boolean;
  count: number;
  onToggle: () => void;
  disabled?: boolean;
};

function LikeToggle({
  like,
  title,
}: {
  like: AmbientTrackLike;
  title: string;
}) {
  return (
    <Button
      size="sm"
      variant="text"
      onClick={like.onToggle}
      disabled={like.disabled}
      aria-pressed={like.liked}
      aria-label={`${like.liked ? 'Unlike' : 'Like'} ${title} (${like.count} likes)`}
      className="gap-1.5 px-1.5 tabular-nums"
    >
      <HeartIcon
        size={16}
        aria-hidden
        className={cn(
          like.liked && 'fill-accent-red-strong text-accent-red-strong',
        )}
      />
      <span aria-hidden>{like.count.toLocaleString()}</span>
    </Button>
  );
}

export type AmbientTrackRowProps = {
  trackId: string;
  title: string;
  /** When set, replaces the plain title text (e.g. a router Link). */
  titleNode?: ReactNode;
  /** Status / error lines under the title (Studio Sounds). */
  belowTitle?: ReactNode;
  artist: string;
  coverUrl?: string | null;
  durationLabel?: string;
  /** Track length; lets the seekbar step 5 s, read out "1:05 of 3:20" and
   * preview hover times. */
  durationSec?: number | null;
  genreLabel?: string;
  /** Public totals and the release date, shown bottom-right like a
   * hearthis.at row. Each part shows only when present. */
  stats?: AmbientTrackStats;
  /** A like toggle with its public count, shown first in the actions row
   * (the count then leaves the stats line). */
  like?: AmbientTrackLike;
  peaks?: number[] | null;
  /** Playback position, 0–1. */
  progress?: number;
  density?: AmbientTrackRowDensity;
  isPlaying?: boolean;
  onPlay?: () => void;
  onSeek?: (fraction: number) => void;
  /** Listener-facing extras (like / add / download) — not Studio tooling. */
  actions?: ReactNode;
  /**
   * Replaces the waveform (e.g. hearthis.at widget while that track is
   * current). Native seek UI stays hidden so the embed is not stacked on top.
   */
  media?: ReactNode;
  className?: string;
  /** Skip canvas sampling (Storybook / offline). */
  ambientRgb?: [number, number, number] | null;
};

function AmbientTrackRowView({
  trackId,
  title,
  titleNode,
  belowTitle,
  artist,
  coverUrl,
  durationLabel,
  durationSec,
  genreLabel,
  stats,
  like,
  peaks,
  progress = 0,
  density = 'comfortable',
  isPlaying = false,
  onPlay,
  onSeek,
  actions,
  media,
  className,
  ambientRgb,
}: AmbientTrackRowProps) {
  const sampled = useDominantColor(ambientRgb === undefined ? coverUrl : null);
  const rgb = ambientRgb === undefined ? sampled : ambientRgb;
  const layout = DENSITY_LAYOUT[density];

  return (
    <article
      data-testid="ambient-track-row"
      data-density={density}
      className={cn(
        'border-border/40 bg-background-secondary text-foreground flex w-full min-w-0 rounded-lg border',
        layout.pad,
        className,
      )}
      style={ambientStyle(rgb)}
    >
      <MediaArtwork
        src={coverUrl ?? undefined}
        size={layout.art}
        className={cn('shrink-0', layout.artClass)}
        imageReveal={Boolean(coverUrl)}
      />
      <div className={cn('flex min-w-0 flex-1 flex-col', layout.gap)}>
        <div className="flex min-w-0 items-start gap-2">
          {onPlay && !media ? (
            <Tooltip
              content={isPlaying ? `Pause ${title}` : `Play ${title}`}
              side="top"
              wrapperClassName="shrink-0"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={onPlay}
                aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
                className={cn(
                  'border-foreground shrink-0 rounded-full bg-transparent shadow-none',
                  layout.play,
                )}
              >
                {isPlaying ? (
                  <PauseIcon size={layout.playIcon} aria-hidden />
                ) : (
                  <PlayIcon
                    size={layout.playIcon}
                    aria-hidden
                    className="translate-x-px"
                  />
                )}
              </Button>
            </Tooltip>
          ) : null}
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'text-foreground-secondary truncate',
                layout.artist,
              )}
            >
              {artist}
            </p>
            <h3
              className={cn('text-foreground truncate font-bold', layout.title)}
            >
              {titleNode ?? title}
            </h3>
            {belowTitle}
          </div>
          {genreLabel || durationLabel ? (
            <div
              className={cn(
                'text-foreground-secondary flex shrink-0 flex-col items-end gap-1 text-right tabular-nums',
                layout.meta,
              )}
            >
              {genreLabel ? (
                <Badge variant="pill" color="secondary">
                  {genreLabel}
                </Badge>
              ) : null}
              {durationLabel ? <span>{durationLabel}</span> : null}
            </div>
          ) : null}
        </div>
        {media ? (
          <div
            className="border-border w-full min-w-0 overflow-hidden rounded-lg border contain-paint"
            data-testid="ambient-track-row-media"
          >
            {media}
          </div>
        ) : (
          <WaveformSeekbar
            trackId={trackId}
            progress={progress}
            peaks={peaks}
            bars={layout.bars}
            label={title}
            durationSec={durationSec ?? undefined}
            onSeek={onSeek}
            tone={density === 'comfortable' ? 'bold' : 'quiet'}
            className={layout.wave}
          />
        )}
        {actions || stats || like ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {like ? <LikeToggle like={like} title={title} /> : null}
            {actions}
            {stats ? (
              <TrackStats
                stats={like ? { ...stats, likes: undefined } : stats}
                className={layout.meta}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

/** Memoized: list owners rebuild only the rows whose props changed (the
 * current row on a progress tick), so long lists don't redraw every second. */
export const AmbientTrackRow = memo(AmbientTrackRowView);
