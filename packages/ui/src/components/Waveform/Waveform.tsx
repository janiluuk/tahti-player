import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type FC,
  type KeyboardEvent,
} from 'react';
import type WaveSurfer from 'wavesurfer.js';

import { cn } from '../../utils';
import { observeThemeChange, readCssVar } from '../../utils/themeChange';
import { formatTimeSeconds } from '../../utils/time';
import {
  hasPeaks,
  peaksKey,
  peaksToWaveSurfer,
  PLACEHOLDER_PEAKS,
} from './peaks';

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
  /** Spoken position for the seek slider, e.g. "1:05 of 3:20". */
  'aria-valuetext'?: string;
} & Omit<ComponentProps<'div'>, 'children' | 'onSeek'>;

const KEY_STEP_SEC = 5;
const PAGE_STEP_FRACTION = 0.1;

function themeColors(el: HTMLElement) {
  return {
    waveColor: readCssVar(el, '--color-foreground-secondary', '#888'),
    progressColor: readCssVar(el, '--color-primary', '#6cf'),
    cursorColor: readCssVar(el, '--color-foreground', '#fff'),
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
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
  'aria-valuetext': ariaValueText,
  onKeyDown,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [ready, setReady] = useState(false);
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;
  const peaksRef = useRef(peaks);
  peaksRef.current = peaks;
  const heightRef = useRef(height);
  heightRef.current = height;

  const seekable = Boolean(onSeek || media);
  const key = peaksKey(peaks);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || durationSec <= 0) {
      return;
    }

    let cancelled = false;
    const subscriptions: (() => void)[] = [];
    setReady(false);

    const interactive = Boolean(onSeekRef.current || media);
    void Promise.all([
      import('wavesurfer.js'),
      interactive ? import('wavesurfer.js/dist/plugins/hover.esm.js') : null,
    ]).then(([{ default: WaveSurferCtor }, hoverModule]) => {
      if (cancelled || !containerRef.current) {
        return;
      }
      const root = containerRef.current;
      const current = peaksRef.current;

      // Peaks + duration must always be present: without them wavesurfer
      // fetches and decodes the media `src`, and a later `load('')` would
      // strip the global player's source.
      const options: ConstructorParameters<typeof WaveSurferCtor>[0] = {
        container: root,
        height: heightRef.current,
        ...themeColors(root),
        cursorWidth: 1,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: hasPeaks(current),
        interact: interactive,
        dragToSeek: interactive,
        duration: durationSec,
        peaks: hasPeaks(current)
          ? peaksToWaveSurfer(current!)
          : PLACEHOLDER_PEAKS,
        // CSS variables inherit into wavesurfer's shadow root, so the hover
        // line and label follow theme switches without re-creating.
        plugins: hoverModule
          ? [
              hoverModule.default.create({
                lineColor: 'var(--color-foreground)',
                lineWidth: 1,
                labelColor: 'var(--color-foreground)',
                labelBackground: 'var(--color-background-secondary)',
                labelSize: '11px',
                formatTimeCallback: (seconds: number) =>
                  formatTimeSeconds(Math.floor(seconds)),
              }),
            ]
          : [],
      };
      if (media) {
        options.media = media;
      }

      const ws = WaveSurferCtor.create(options);
      wsRef.current = ws;

      subscriptions.push(ws.on('ready', () => setReady(true)));
      subscriptions.push(
        ws.on('interaction', (time: number) => {
          onSeekRef.current?.(clamp01(time / durationSec));
        }),
      );
      subscriptions.push(
        observeThemeChange(() => {
          if (containerRef.current) {
            ws.setOptions(themeColors(containerRef.current));
          }
        }),
      );
    });

    return () => {
      cancelled = true;
      for (const unsubscribe of subscriptions) {
        unsubscribe();
      }
      wsRef.current?.destroy();
      wsRef.current = null;
    };
  }, [durationSec, media, key]);

  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.options.height !== height) {
      ws.setOptions({ height });
    }
  }, [height]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || media || progress == null || !Number.isFinite(progress)) {
      return;
    }
    const time = clamp01(progress) * durationSec;
    if (Math.abs(ws.getCurrentTime() - time) > 0.05) {
      ws.setTime(time);
    }
  }, [progress, durationSec, media, ready]);

  const currentFraction = (): number => {
    if (media && durationSec > 0) {
      return clamp01(media.currentTime / durationSec);
    }
    if (progress != null && Number.isFinite(progress)) {
      return clamp01(progress);
    }
    const ws = wsRef.current;
    return ws && durationSec > 0
      ? clamp01(ws.getCurrentTime() / durationSec)
      : 0;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !seekable || durationSec <= 0) {
      return;
    }
    const step = KEY_STEP_SEC / durationSec;
    const from = currentFraction();
    const next = (() => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          return from - step;
        case 'ArrowRight':
        case 'ArrowUp':
          return from + step;
        case 'PageDown':
          return from - PAGE_STEP_FRACTION;
        case 'PageUp':
          return from + PAGE_STEP_FRACTION;
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
    const fraction = clamp01(next);
    wsRef.current?.setTime(fraction * durationSec);
    onSeekRef.current?.(fraction);
  };

  const valueNow = Math.round(
    clamp01(progress != null && Number.isFinite(progress) ? progress : 0) * 100,
  );

  return (
    <div
      ref={containerRef}
      {...(seekable
        ? {
            role: 'slider',
            tabIndex: 0,
            'aria-valuemin': 0,
            'aria-valuemax': 100,
            'aria-valuenow': valueNow,
            'aria-valuetext': ariaValueText,
          }
        : { role: 'img' })}
      aria-label={ariaLabel}
      data-waveform={hasPeaks(peaks) ? 'peaks' : 'empty'}
      data-state={ready ? 'ready' : 'loading'}
      onKeyDown={handleKeyDown}
      className={cn(
        'focus-visible:ring-primary min-h-12 w-full overflow-hidden rounded-sm outline-none focus-visible:ring-2',
        !ready &&
          'bg-background-secondary/40 animate-pulse motion-reduce:animate-none',
        className,
      )}
      style={{ height, ...style }}
      {...rest}
    />
  );
};
