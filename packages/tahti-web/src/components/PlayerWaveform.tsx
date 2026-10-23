import { MessageCircleIcon } from 'lucide-react';

import { Button, Tooltip, Waveform } from '@tahti-player/ui';

import { cn } from '../lib/cn';
import { formatDuration } from '../lib/playableToTrack';
import { usePlayerStore } from '../stores/playerStore';

export type PlayerWaveformProps = {
  peaks?: number[] | null;
  durationSec?: number;
  height?: number;
  className?: string;
  trackId?: string;
  /** Timed comments; with a `label` each becomes a button that seeks. */
  markers?: Array<{ fraction: number; label?: string; count?: number }>;
  onSeek?: (fraction: number) => void;
  /** Accessible name, e.g. the track title; defaults to "Waveform". */
  label?: string;
};

export function PlayerWaveform({
  peaks,
  durationSec,
  height,
  className,
  trackId,
  markers,
  onSeek,
  label,
}: PlayerWaveformProps) {
  const currentId = usePlayerStore((s) => s.currentId);
  const audioElement = usePlayerStore((s) => s.audioElement);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const currentPeaks = usePlayerStore((s) => s.currentPeaks);
  const seekTo = usePlayerStore((s) => s.seekTo);

  const isCurrent = trackId == null || currentId === trackId;
  const totalDuration = durationSec ?? (isCurrent ? duration : 0);
  const resolvedPeaks = peaks ?? (isCurrent ? currentPeaks : null);
  const media = isCurrent ? audioElement : null;
  const progress =
    isCurrent && totalDuration > 0 ? currentTime / totalDuration : 0;

  const valueText =
    totalDuration > 0
      ? `${formatDuration(progress * totalDuration)} of ${formatDuration(totalDuration)}`
      : undefined;

  const handleSeek = (fraction: number) => {
    if (isCurrent && !onSeek) {
      if (totalDuration > 0) {
        seekTo(fraction * totalDuration);
      }
      return;
    }
    onSeek?.(fraction);
  };

  return (
    <div className="relative w-full" data-track-id={trackId}>
      <Waveform
        peaks={resolvedPeaks}
        durationSec={totalDuration}
        media={media}
        progress={progress}
        onSeek={handleSeek}
        height={height}
        className={className}
        aria-label={label ? `Waveform: ${label}` : 'Waveform'}
        aria-valuetext={valueText}
      />
      {markers?.map((marker, index) => {
        const left = `${Math.min(100, Math.max(0, marker.fraction)) * 100}%`;
        const icon = (
          <MessageCircleIcon size={12} className="fill-current" aria-hidden />
        );
        if (!marker.label) {
          return (
            <span
              key={`marker-${index}`}
              className={cn(
                'text-accent-yellow pointer-events-none absolute top-0',
                '-translate-x-1/2 -translate-y-1/4 drop-shadow',
              )}
              style={{ left }}
            >
              {icon}
            </span>
          );
        }
        return (
          <span
            key={`marker-${marker.fraction}-${index}`}
            className="absolute top-0 z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left }}
          >
            <Tooltip content={marker.label} side="top" multiline>
              <Button
                variant="plain"
                size="flexible"
                aria-label={`Jump to comment: ${marker.label}`}
                data-testid="waveform-comment-marker"
                className="text-accent-yellow relative size-5 justify-center rounded-full p-0 drop-shadow"
                onClick={() => handleSeek(marker.fraction)}
              >
                {icon}
                {marker.count && marker.count > 1 ? (
                  <span className="bg-background text-foreground absolute -top-1 -right-1 rounded-full px-1 text-[9px] leading-tight font-semibold">
                    {marker.count}
                  </span>
                ) : null}
              </Button>
            </Tooltip>
          </span>
        );
      })}
    </div>
  );
}
