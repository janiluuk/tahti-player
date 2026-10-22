import { MessageCircleIcon } from 'lucide-react';

import { Waveform } from '@tahti-player/ui';

import { cn } from '../lib/cn';
import { formatDuration } from '../lib/playableToTrack';
import { usePlayerStore } from '../stores/playerStore';

export type PlayerWaveformProps = {
  peaks?: number[] | null;
  durationSec?: number;
  height?: number;
  className?: string;
  trackId?: string;
  markers?: Array<{ fraction: number }>;
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
      {markers?.map((marker, index) => (
        <span
          key={`marker-${index}`}
          className={cn(
            'text-accent-yellow pointer-events-none absolute top-0',
            '-translate-x-1/2 -translate-y-1/4 drop-shadow',
          )}
          style={{
            left: `${Math.min(100, Math.max(0, marker.fraction)) * 100}%`,
          }}
        >
          <MessageCircleIcon size={12} className="fill-current" aria-hidden />
        </span>
      ))}
    </div>
  );
}
