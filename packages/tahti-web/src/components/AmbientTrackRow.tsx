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

/** Synthetic [0..255] peaks for Storybook / empty demos — not real audio. */
export function mockAmbientPeaks(seed = 1, count = 96): number[] {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + seed * 7) / count;
    const wave =
      0.35 +
      0.45 * Math.abs(Math.sin(t * Math.PI * 4 + seed)) +
      0.2 * Math.abs(Math.sin(t * Math.PI * 11));
    return Math.round(40 + wave * 200);
  });
}

export type AmbientTrackRowDensity = 'comfortable' | 'compact';

export type AmbientTrackRowProps = {
  trackId: string;
  title: string;
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
  className?: string;
  /** Skip canvas sampling (Storybook / offline). */
  ambientRgb?: [number, number, number] | null;
};

export function AmbientTrackRow({
  trackId,
  title,
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
  className,
  ambientRgb,
}: AmbientTrackRowProps) {
  const sampled = useDominantColor(ambientRgb === undefined ? coverUrl : null);
  const rgb = ambientRgb === undefined ? sampled : ambientRgb;
  const compact = density === 'compact';
  const meta = [genreLabel, durationLabel].filter(Boolean).join(' · ');

  return (
    <article
      data-testid="ambient-track-row"
      data-density={density}
      className={cn(
        'border-border/40 flex w-full min-w-0 rounded-lg border',
        compact ? 'gap-2 p-2' : 'gap-3 p-3',
        className,
      )}
      style={ambientStyle(rgb)}
    >
      <MediaArtwork
        src={coverUrl ?? undefined}
        size={compact ? 'thumb' : 'md'}
        className="shrink-0"
        imageReveal={Boolean(coverUrl)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-start gap-2">
          {onPlay ? (
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
                compact ? 'text-[11px]' : 'text-xs',
              )}
            >
              {artist}
            </p>
            <h3
              className={cn(
                'text-foreground truncate font-semibold',
                compact ? 'text-sm' : 'text-base',
              )}
            >
              {title}
            </h3>
          </div>
          {meta ? (
            <p
              className={cn(
                'text-foreground-secondary shrink-0 text-right',
                compact ? 'text-[11px]' : 'text-xs',
              )}
            >
              {meta}
            </p>
          ) : null}
        </div>
        <WaveformSeekbar
          trackId={trackId}
          progress={progress}
          peaks={peaks}
          bars={compact ? 48 : 72}
          onSeek={onSeek}
          className={compact ? 'h-6' : 'h-11'}
        />
        {actions ? (
          <div
            className={cn(
              'flex flex-wrap items-center gap-1.5',
              compact && 'gap-1',
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </article>
  );
}
