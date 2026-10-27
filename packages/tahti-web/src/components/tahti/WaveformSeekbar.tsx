import { MessageCircleIcon } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

import { cn } from '../../lib/cn';
import { formatDuration } from '../../lib/playableToTrack';
import { PlayerLiveIndicator } from '../PlayerSeekBar';

/** Flat dim bars for tracks with no decoded peaks — reads as "no waveform
 * data" instead of fabricated PRNG noise that looked like real audio. */
function emptyHeights(bars: number): number[] {
  return Array.from({ length: bars }, () => 16);
}

/** Downsample real peak buckets to the bar count, keeping each bar's loudest
 * bucket so short transients stay visible. */
export function resamplePeaks(peaks: number[], bars: number): number[] {
  if (peaks.length === bars) {
    return peaks;
  }
  return Array.from({ length: bars }, (_, i) => {
    const start = Math.floor((i / bars) * peaks.length);
    const end = Math.max(
      start + 1,
      Math.floor(((i + 1) / bars) * peaks.length),
    );
    let max = 0;
    for (let j = start; j < end && j < peaks.length; j++) {
      max = Math.max(max, peaks[j]!);
    }
    return max;
  });
}

function heightsFromPeaks(peaks: number[]): number[] {
  let max = 1;
  for (const peak of peaks) {
    max = Math.max(max, peak);
  }
  return peaks.map((p) => Math.max(6, (p / max) * 100));
}

const BAR_COUNT = 64;
const AUTO_BAR_PX = 4;
const AUTO_MIN_BARS = 16;
const AUTO_MAX_BARS = 160;

/** Bars that fit `width` px at about one bar per 4 px. */
export function autoBarCount(width: number): number {
  if (!(width > 0)) {
    return BAR_COUNT;
  }
  return Math.min(
    AUTO_MAX_BARS,
    Math.max(AUTO_MIN_BARS, Math.round(width / AUTO_BAR_PX)),
  );
}
const KEY_STEP_SEC = 5;
const KEY_STEP_FRACTION = 0.02;
const PAGE_STEP_FRACTION = 0.1;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** The tahti waveform motif used as a scrubbable progress bar. Draws real
 * decoded amplitude buckets when `peaks` is given; otherwise a flat dim
 * placeholder (still seekable) so peakless tracks are not mistaken for audio. */
export function WaveformSeekbar({
  trackId,
  progress,
  peaks,
  bars = 'auto',
  markers,
  onSeek,
  live = false,
  playedColor,
  unplayedColor,
  tone = 'quiet',
  label,
  durationSec,
  className,
}: {
  trackId: string;
  /** Playback position, 0–1. */
  progress: number;
  /** Real [0..255] amplitude buckets, when decoded — null/omitted uses the
   * flat empty placeholder. */
  peaks?: number[] | null;
  /** Bar count, or `auto` (default) to fit the width - never one bar per
   * stored peak, which is 600 for tahti-org tracks. */
  bars?: number | 'auto';
  markers?: Array<{ fraction: number }>;
  onSeek?: (fraction: number) => void;
  /** Live streams have no seekable duration — flat bars, Live badge, no scrub. */
  live?: boolean;
  playedColor?: string;
  unplayedColor?: string;
  /** `bold` draws unplayed bars near the text colour, for large rows where
   * the waveform is the main visual (like a hearthis.at row). */
  tone?: 'quiet' | 'bold';
  /** Track title for the slider's accessible name. */
  label?: string;
  /** Enables 5 s keyboard steps and "1:05 of 3:20" value text. */
  durationSec?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [hoverFraction, setHoverFraction] = useState<number | null>(null);
  const [autoBars, setAutoBars] = useState(BAR_COUNT);
  const barCount = bars === 'auto' ? autoBars : bars;

  useEffect(() => {
    const el = ref.current;
    if (bars !== 'auto' || !el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const measure = () => setAutoBars(autoBarCount(el.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [bars]);

  const hasPeaks = Boolean(peaks && peaks.length > 0);
  const heights = useMemo(
    () =>
      hasPeaks
        ? heightsFromPeaks(resamplePeaks(peaks!, barCount))
        : emptyHeights(barCount),
    [hasPeaks, peaks, barCount],
  );
  const clamped = live ? 0 : clamp01(progress);
  const filledCount = live ? 0 : Math.round(clamped * barCount);
  const seekEnabled = Boolean(onSeek) && !live;
  const hasDuration = durationSec != null && durationSec > 0;

  const seekAt = (clientX: number) => {
    if (!seekEnabled || !onSeek || !ref.current) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }
    onSeek(clamp01((clientX - rect.left) / rect.width));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!seekEnabled || event.button > 0) {
      return;
    }
    draggingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    seekAt(event.clientX);
  };

  const fractionAt = (clientX: number): number | null => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) {
      return null;
    }
    return clamp01((clientX - rect.left) / rect.width);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      seekAt(event.clientX);
    }
    if (event.pointerType === 'mouse' && hasDuration) {
      setHoverFraction(fractionAt(event.clientX));
    }
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!seekEnabled || !onSeek) {
      return;
    }
    const step = hasDuration ? KEY_STEP_SEC / durationSec : KEY_STEP_FRACTION;
    const next = (() => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          return clamped - step;
        case 'ArrowRight':
        case 'ArrowUp':
          return clamped + step;
        case 'PageDown':
          return clamped - PAGE_STEP_FRACTION;
        case 'PageUp':
          return clamped + PAGE_STEP_FRACTION;
        case 'Home':
          return 0;
        case 'End':
          return 1;
        default:
          return null;
      }
    })();
    if (next == null) {
      return;
    }
    event.preventDefault();
    onSeek(clamp01(next));
  };

  const valueText = hasDuration
    ? `${formatDuration(clamped * durationSec)} of ${formatDuration(durationSec)}`
    : `${Math.round(clamped * 100)}%`;

  const waveform = (
    <div
      ref={ref}
      role={seekEnabled ? 'slider' : undefined}
      tabIndex={seekEnabled ? 0 : undefined}
      aria-label={seekEnabled ? (label ? `Seek ${label}` : 'Seek') : undefined}
      aria-valuemin={seekEnabled ? 0 : undefined}
      aria-valuemax={seekEnabled ? 100 : undefined}
      aria-valuenow={seekEnabled ? Math.round(clamped * 100) : undefined}
      aria-valuetext={seekEnabled ? valueText : undefined}
      data-waveform={live ? 'live' : hasPeaks ? 'peaks' : 'empty'}
      data-track-id={trackId}
      className={cn(
        'relative',
        seekEnabled &&
          'focus-visible:ring-primary cursor-pointer touch-pan-y rounded-sm outline-none focus-visible:ring-2',
        (!hasPeaks || live) && 'opacity-60',
        live ? undefined : className,
      )}
      onPointerDown={seekEnabled ? onPointerDown : undefined}
      onPointerMove={seekEnabled ? onPointerMove : undefined}
      onPointerUp={seekEnabled ? endDrag : undefined}
      onPointerCancel={seekEnabled ? endDrag : undefined}
      onPointerLeave={seekEnabled ? () => setHoverFraction(null) : undefined}
      onKeyDown={seekEnabled ? onKeyDown : undefined}
    >
      {seekEnabled && hasDuration && hoverFraction != null ? (
        <span
          aria-hidden
          data-testid="waveform-seekbar-hover"
          className="bg-foreground/70 pointer-events-none absolute inset-y-0 z-10 w-px"
          style={{ left: `${hoverFraction * 100}%` }}
        >
          <span className="bg-background-secondary text-foreground absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded px-1 py-0.5 text-[10px] leading-none font-medium whitespace-nowrap tabular-nums shadow-sm">
            {formatDuration(hoverFraction * durationSec)}
          </span>
        </span>
      ) : null}
      <div className="flex h-full items-end gap-px">
        {heights.map((h, i) => (
          <span
            key={i}
            className={cn(
              'flex-1 origin-bottom rounded-sm transition-colors',
              i < filledCount
                ? !playedColor &&
                    (hasPeaks ? 'bg-primary' : 'bg-foreground-secondary/40')
                : !unplayedColor &&
                    (tone === 'bold' && hasPeaks
                      ? 'bg-foreground/55'
                      : 'bg-foreground-secondary/20'),
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
      {live ? (
        <div
          className="bg-stripes-diagonal pointer-events-none absolute inset-0 opacity-70"
          aria-hidden
        />
      ) : null}
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

  if (live) {
    return (
      <div
        className={cn('flex w-full flex-col gap-1', className)}
        data-testid="waveform-seekbar-live"
      >
        <PlayerLiveIndicator />
        {waveform}
      </div>
    );
  }

  return waveform;
}
