import { MessageCircleIcon } from 'lucide-react';
import { useRef } from 'react';

import { cn } from '../../lib/cn';

/** Flat dim bars for tracks with no decoded peaks — reads as "no waveform
 * data" instead of fabricated PRNG noise that looked like real audio. */
function emptyHeights(bars: number): number[] {
  return Array.from({ length: bars }, () => 16);
}

/** Downsample real peak buckets to the bar count, averaging each bar's span. */
function resamplePeaks(peaks: number[], bars: number): number[] {
  if (peaks.length === bars) {
    return peaks;
  }
  return Array.from({ length: bars }, (_, i) => {
    const start = Math.floor((i / bars) * peaks.length);
    const end = Math.max(
      start + 1,
      Math.floor(((i + 1) / bars) * peaks.length),
    );
    let sum = 0;
    let count = 0;
    for (let j = start; j < end && j < peaks.length; j++) {
      sum += peaks[j]!;
      count++;
    }
    return count > 0 ? sum / count : 0;
  });
}

function heightsFromPeaks(peaks: number[]): number[] {
  const max = Math.max(1, ...peaks);
  return peaks.map((p) => Math.max(6, (p / max) * 100));
}

const BAR_COUNT = 64;

/** The tahti waveform motif used as a scrubbable progress bar. Draws real
 * decoded amplitude buckets when `peaks` is given; otherwise a flat dim
 * placeholder (still seekable) so peakless tracks are not mistaken for audio. */
export function WaveformSeekbar({
  trackId,
  progress,
  peaks,
  bars = BAR_COUNT,
  markers,
  onSeek,
  playedColor,
  unplayedColor,
  className,
}: {
  trackId: string;
  /** Playback position, 0–1. */
  progress: number;
  /** Real [0..255] amplitude buckets, when decoded — null/omitted uses the
   * flat empty placeholder. */
  peaks?: number[] | null;
  bars?: number;
  markers?: Array<{ fraction: number }>;
  onSeek?: (fraction: number) => void;
  playedColor?: string;
  unplayedColor?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hasPeaks = Boolean(peaks && peaks.length > 0);
  const heights = hasPeaks
    ? heightsFromPeaks(resamplePeaks(peaks!, bars))
    : emptyHeights(bars);
  const clamped = Math.min(1, Math.max(0, progress));
  const filledCount = Math.round(clamped * bars);

  const seekAt = (clientX: number) => {
    if (!onSeek || !ref.current) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const fraction = Math.min(
      1,
      Math.max(0, (clientX - rect.left) / rect.width),
    );
    onSeek(fraction);
  };

  return (
    <div
      ref={ref}
      role={onSeek ? 'slider' : undefined}
      aria-label={onSeek ? 'Seek' : undefined}
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? 100 : undefined}
      aria-valuenow={onSeek ? Math.round(clamped * 100) : undefined}
      data-waveform={hasPeaks ? 'peaks' : 'empty'}
      data-track-id={trackId}
      className={cn(
        'relative',
        onSeek && 'cursor-pointer',
        !hasPeaks && 'opacity-60',
        className,
      )}
      onClick={onSeek ? (e) => seekAt(e.clientX) : undefined}
    >
      <div className="flex h-full items-end gap-px">
        {heights.map((h, i) => (
          <span
            key={i}
            className={cn(
              'flex-1 origin-bottom rounded-sm transition-colors',
              i < filledCount
                ? !playedColor &&
                    (hasPeaks ? 'bg-primary' : 'bg-foreground-secondary/40')
                : !unplayedColor && 'bg-foreground-secondary/20',
            )}
            style={{
              height: `${h}%`,
              ...(i < filledCount
                ? playedColor
                  ? { backgroundColor: playedColor }
                  : {}
                : unplayedColor
                  ? { backgroundColor: unplayedColor }
                  : {}),
            }}
          />
        ))}
      </div>
      {markers?.map((marker, index) => (
        <span
          key={`marker-${index}`}
          className="text-accent-yellow pointer-events-none absolute top-0 -translate-x-1/2 -translate-y-1/4 drop-shadow"
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
