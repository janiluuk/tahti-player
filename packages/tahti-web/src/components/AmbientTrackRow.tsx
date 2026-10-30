import {
  CirclePlayIcon,
  DownloadIcon,
  HeartIcon,
  MessageCircleIcon,
} from 'lucide-react';
import { memo, useEffect, useRef, useState, type ReactNode } from 'react';

import {
  Badge,
  Button,
  MediaArtwork,
  TrackProcessing,
  Waveform,
} from '@tahti-player/ui';

import { cn } from '../lib/cn';
import { formatDuration } from '../lib/playableToTrack';
import { useDominantColor } from '../lib/useDominantColor';

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
    art: string;
    artist: string;
    title: string;
    meta: string;
    bars: number;
    wave: string;
  }
> = {
  comfortable: {
    pad: 'gap-3 p-3 sm:gap-4 sm:p-4',
    gap: 'gap-2',
    art: 'size-24 sm:size-44',
    artist: 'text-sm',
    title: 'text-lg sm:text-xl',
    meta: 'text-sm',
    bars: 96,
    wave: 'h-14',
  },
  compact: {
    pad: 'gap-3 p-2.5',
    gap: 'gap-1.5',
    art: 'size-20 sm:size-32',
    artist: 'text-xs',
    title: 'text-sm sm:text-base',
    meta: 'text-sm',
    bars: 64,
    wave: 'h-9',
  },
  dense: {
    pad: 'gap-2 px-2 py-1.5',
    gap: 'gap-0.5',
    art: 'size-12',
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
  comments?: number;
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
    [
      'comments',
      stats.comments,
      <MessageCircleIcon size={14} aria-hidden />,
      'comments',
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
      className="h-8 gap-1.5 px-2 tabular-nums"
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
  processing?: boolean;
  audioUrl?: string;
  loadAudioUrl?: () => Promise<string | undefined>;
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
  audioUrl,
  processing = false,
  loadAudioUrl,
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
  const rowRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!rowRef.current || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' },
    );
    observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, []);
  const loadAudioRef = useRef(loadAudioUrl);
  loadAudioRef.current = loadAudioUrl;
  const canLoadAudio = Boolean(loadAudioUrl);
  const [loadedAudioUrl, setLoadedAudioUrl] = useState<string>();
  useEffect(() => {
    setLoadedAudioUrl(undefined);
    if (processing || !visible || peaks?.length || audioUrl || !canLoadAudio) {
      return;
    }
    let cancelled = false;
    void loadAudioRef.current!()
      .then((url) => {
        if (!cancelled) {
          setLoadedAudioUrl(url);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visible, trackId, peaks, audioUrl, canLoadAudio, processing]);
  const sampled = useDominantColor(ambientRgb === undefined ? coverUrl : null);
  const rgb = ambientRgb === undefined ? sampled : ambientRgb;
  const layout = DENSITY_LAYOUT[density];
  const playable = Boolean(onPlay) && !media && !processing;

  return (
    <article
      ref={rowRef}
      data-testid="ambient-track-row"
      data-density={density}
      className={cn(
        'group border-border/40 bg-background-secondary text-foreground flex w-full min-w-0 rounded-lg border',
        density !== 'dense' && 'flex-wrap sm:flex-nowrap',
        layout.pad,
        className,
      )}
      style={ambientStyle(rgb)}
    >
      <div
        className={cn(
          'relative shrink-0 self-start overflow-hidden rounded-md',
          layout.art,
        )}
        data-testid="ambient-track-row-artwork"
      >
        <MediaArtwork
          src={coverUrl ?? undefined}
          size="fill"
          imageReveal={Boolean(coverUrl)}
          isPlaying={isPlaying}
          onPlay={playable ? onPlay : undefined}
          playLabel={`Play ${title}`}
          pauseLabel={`Pause ${title}`}
        />
        {durationLabel && density !== 'dense' ? (
          <span className="pointer-events-none absolute right-1.5 bottom-1.5 rounded bg-black/65 px-1.5 py-0.5 text-xs text-white tabular-nums">
            {durationLabel}
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          'min-w-0 flex-1 flex-col',
          density === 'dense' ? 'flex' : 'contents sm:flex',
          layout.gap,
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
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
              className={cn(
                'text-foreground line-clamp-2 font-bold sm:truncate',
                layout.title,
              )}
            >
              {titleNode ?? title}
            </h3>
          </div>
          {genreLabel || (durationLabel && density === 'dense') ? (
            <div
              className={cn(
                'text-foreground-secondary hidden shrink-0 flex-col items-end gap-1 text-right tabular-nums sm:flex',
                layout.meta,
              )}
            >
              {genreLabel ? (
                <Badge variant="pill" color="secondary">
                  {genreLabel}
                </Badge>
              ) : null}
              {durationLabel && density === 'dense' ? (
                <span>{durationLabel}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        {processing ? (
          <TrackProcessing variant="waveform" label="Processing audio…" />
        ) : media ? (
          <div
            className="border-border w-full min-w-0 overflow-hidden rounded-lg border contain-paint"
            data-testid="ambient-track-row-media"
          >
            {media}
          </div>
        ) : (
          <div className="w-full min-w-0" data-track-id={trackId}>
            {visible ? (
              <Waveform
                progress={progress}
                peaks={peaks}
                audioUrl={audioUrl ?? loadedAudioUrl}
                durationSec={durationSec ?? 1}
                onSeek={onSeek}
                aria-label={`Seek ${title}`}
                aria-valuetext={
                  durationSec
                    ? `${formatDuration(progress * durationSec)} of ${formatDuration(durationSec)}`
                    : undefined
                }
                height={
                  density === 'comfortable'
                    ? 64
                    : density === 'compact'
                      ? 48
                      : 28
                }
              />
            ) : (
              <div className={layout.wave} />
            )}
          </div>
        )}
        {belowTitle ? <div className="w-full min-w-0">{belowTitle}</div> : null}
        {actions || stats || like ? (
          <div className="flex w-full flex-wrap items-center gap-1.5">
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
