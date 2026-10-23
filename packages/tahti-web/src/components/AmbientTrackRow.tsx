import { PauseIcon, PlayIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, MediaArtwork } from '@tahti-player/ui';

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
    artist: string;
    title: string;
    meta: string;
    bars: number;
    wave: string;
  }
> = {
  comfortable: {
    pad: 'gap-3 p-3',
    gap: 'gap-1.5',
    art: 'md',
    artist: 'text-xs',
    title: 'text-base',
    meta: 'text-xs',
    bars: 72,
    wave: 'h-11',
  },
  compact: {
    pad: 'gap-2 p-2',
    gap: 'gap-1',
    art: 'thumb',
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
    artist: 'text-[10px]',
    title: 'text-xs',
    meta: 'text-[10px]',
    bars: 36,
    wave: 'h-4',
  },
};

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
  genreLabel?: string;
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

export function AmbientTrackRow({
  trackId,
  title,
  titleNode,
  belowTitle,
  artist,
  coverUrl,
  durationLabel,
  genreLabel,
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
  const meta = [genreLabel, durationLabel].filter(Boolean).join(' · ');

  return (
    <article
      data-testid="ambient-track-row"
      data-density={density}
      className={cn(
        'border-border/40 flex w-full min-w-0 rounded-lg border',
        layout.pad,
        className,
      )}
      style={ambientStyle(rgb)}
    >
      <MediaArtwork
        src={coverUrl ?? undefined}
        size={layout.art}
        className="shrink-0"
        imageReveal={Boolean(coverUrl)}
      />
      <div className={cn('flex min-w-0 flex-1 flex-col', layout.gap)}>
        <div className="flex min-w-0 items-start gap-2">
          {onPlay && !media ? (
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={onPlay}
              aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
              className="shrink-0"
            >
              {isPlaying ? (
                <PauseIcon size={14} aria-hidden />
              ) : (
                <PlayIcon size={14} aria-hidden />
              )}
            </Button>
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
              className={cn(
                'text-foreground truncate font-semibold',
                layout.title,
              )}
            >
              {titleNode ?? title}
            </h3>
            {belowTitle}
          </div>
          {meta ? (
            <p
              className={cn(
                'text-foreground-secondary shrink-0 text-right',
                layout.meta,
              )}
            >
              {meta}
            </p>
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
            onSeek={onSeek}
            className={layout.wave}
          />
        )}
        {actions ? (
          <div className="flex flex-wrap items-center gap-1.5">{actions}</div>
        ) : null}
      </div>
    </article>
  );
}
