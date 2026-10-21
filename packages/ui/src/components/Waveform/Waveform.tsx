import {
  useEffect,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type FC,
} from 'react';
import type WaveSurfer from 'wavesurfer.js';

import { cn } from '../../utils';
import { hasPeaks, peaksToWaveSurfer } from './peaks';

export type WaveformProps = {
  peaks?: number[] | null;
  durationSec: number;
  /** Global player `<audio>` when binding progress/seek to one source. */
  media?: HTMLMediaElement | null;
  /** 0..1 progress when not using `media` (or while media is unbound). */
  progress?: number;
  onSeek?: (fraction: number) => void;
  height?: number;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
} & Omit<ComponentProps<'div'>, 'children' | 'onSeek'>;

function readCssVar(el: HTMLElement, name: string, fallback: string): string {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || fallback;
}

/** Large preview / editor waveform powered by wavesurfer.js. Lazy-loads the
 * library; ambient list rows should keep the light canvas instead. */
export const Waveform: FC<WaveformProps> = ({
  peaks,
  durationSec,
  media = null,
  progress,
  onSeek,
  height = 96,
  className,
  style,
  'aria-label': ariaLabel = 'Waveform',
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || durationSec <= 0) {
      return;
    }

    let cancelled = false;
    let interactionSub: (() => void) | undefined;

    void import('wavesurfer.js').then(({ default: WaveSurferCtor }) => {
      if (cancelled || !containerRef.current) {
        return;
      }
      const root = containerRef.current;
      const waveColor = readCssVar(
        root,
        '--color-foreground-secondary',
        '#888',
      );
      const progressColor = readCssVar(root, '--color-primary', '#6cf');
      const cursorColor = readCssVar(root, '--color-foreground', '#fff');

      const options: ConstructorParameters<typeof WaveSurferCtor>[0] = {
        container: root,
        height,
        waveColor,
        progressColor,
        cursorColor,
        cursorWidth: 1,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
        interact: Boolean(onSeekRef.current || media),
        dragToSeek: Boolean(onSeekRef.current || media),
        duration: durationSec,
      };

      if (media) {
        options.media = media;
      }

      if (hasPeaks(peaks)) {
        options.peaks = peaksToWaveSurfer(peaks!);
      }

      const ws = WaveSurferCtor.create(options);
      wsRef.current = ws;

      if (!hasPeaks(peaks)) {
        ws.load('', [new Float32Array(64).fill(0.08)], durationSec);
      }

      interactionSub = ws.on('interaction', (time: number) => {
        if (!Number.isFinite(durationSec) || durationSec <= 0) {
          return;
        }
        const fraction = Math.min(1, Math.max(0, time / durationSec));
        onSeekRef.current?.(fraction);
      });
    });

    return () => {
      cancelled = true;
      interactionSub?.();
      wsRef.current?.destroy();
      wsRef.current = null;
    };
  }, [durationSec, height, media, peaks]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || media || progress == null || !Number.isFinite(progress)) {
      return;
    }
    const time = Math.min(1, Math.max(0, progress)) * durationSec;
    if (Math.abs(ws.getCurrentTime() - time) > 0.05) {
      ws.setTime(time);
    }
  }, [progress, durationSec, media]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      data-waveform={hasPeaks(peaks) ? 'peaks' : 'empty'}
      className={cn('min-h-12 w-full overflow-hidden', className)}
      style={{ height, ...style }}
      {...rest}
    />
  );
};
