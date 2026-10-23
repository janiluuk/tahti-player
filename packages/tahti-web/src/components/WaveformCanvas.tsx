import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

import { observeThemeChange } from '@tahti-player/ui';

import type { EditCut } from '../api/studio-types';
import { formatDuration } from '../lib/playableToTrack';

type Props = {
  peaks: number[];
  durationSec: number;
  currentTime: number;
  cuts: EditCut[];
  selection: { start: number; end: number } | null;
  /** 0..1 visible window into the timeline — lets the canvas zoom/pan
   * instead of always drawing the full duration. Defaults to the whole
   * track when omitted. */
  viewStart?: number;
  viewEnd?: number;
  /** Called on wheel-zoom (zoom-to-cursor, matching a scroll/trackpad
   * "zoom the waveform" gesture) and on minimap drag-to-pan. */
  onViewChange?: (start: number, end: number) => void;
  onSeek: (sec: number) => void;
  onSelectRange?: (start: number, end: number) => void;
  label?: string;
};

/** Reads a theme colour token at draw time so the canvas re-themes with
 * the rest of the app instead of hardcoding one palette. */
function themeColor(
  canvas: HTMLCanvasElement,
  token: string,
  fallback: string,
) {
  const v = getComputedStyle(canvas).getPropertyValue(token).trim();
  return v || fallback;
}

const MIN_SPAN = 0.005;
const PLACEHOLDER_BARS = 256;
const PLACEHOLDER_AMP = 0.06;
const KEY_STEP_SEC = 1;
const KEY_PAGE_SEC = 10;

function peakMaxOf(peaks: number[]): number {
  let max = 1;
  for (const peak of peaks) {
    if (Number.isFinite(peak) && peak > max) {
      max = peak;
    }
  }
  return max;
}

/** Peaks waveform with zoom (wheel, zoom-to-cursor), playhead, cut
 * regions, and click/drag selection — all scoped to the current
 * viewStart/viewEnd window rather than always the full track. */
export function WaveformCanvas({
  peaks,
  durationSec,
  currentTime,
  cuts,
  selection,
  viewStart = 0,
  viewEnd = 1,
  onViewChange,
  onSeek,
  onSelectRange,
  label = 'Waveform',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ startX: number; startSec: number } | null>(null);
  const span = Math.max(MIN_SPAN, viewEnd - viewStart);
  const hasPeaks = peaks.length > 0;
  const peakMax = useMemo(() => peakMaxOf(peaks), [peaks]);
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(
    () => observeThemeChange(() => setThemeVersion((version) => version + 1)),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    function draw() {
      if (!canvas) {
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth || 640;
      const cssH = canvas.clientHeight || 96;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = cssW;
      const h = cssH;
      const barColor = hasPeaks
        ? themeColor(canvas, '--color-accent-cyan', 'rgba(120, 220, 200, 1)')
        : themeColor(
            canvas,
            '--color-foreground-secondary',
            'rgba(160, 160, 160, 1)',
          );
      const selColor = themeColor(
        canvas,
        '--color-primary',
        'rgba(255, 220, 80, 1)',
      );
      const cutColor = themeColor(
        canvas,
        '--color-accent-red',
        'rgba(220, 80, 80, 1)',
      );

      ctx.clearRect(0, 0, w, h);

      const all = hasPeaks ? peaks : null;
      const count = all ? all.length : PLACEHOLDER_BARS;
      const startIdx = Math.floor(viewStart * count);
      const endIdx = Math.max(startIdx + 1, Math.ceil(viewEnd * count));
      const visible = endIdx - startIdx;
      const barW = w / visible;
      if (!all) {
        ctx.globalAlpha = 0.4;
      }
      for (let i = 0; i < visible; i++) {
        const amp = all
          ? Math.max(0.05, Math.min(1, (all[startIdx + i] ?? 0) / peakMax))
          : PLACEHOLDER_AMP;
        const bh = amp * (h - 8);
        const x = i * barW;
        const y = (h - bh) / 2;
        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, Math.max(1, barW - 0.5), bh);
      }
      ctx.globalAlpha = 1;

      const toX = (sec: number) => ((sec / durationSec - viewStart) / span) * w;

      for (const cut of cuts) {
        if (durationSec <= 0) {
          continue;
        }
        const x0 = toX(cut.start);
        const x1 = toX(cut.end);
        if (x1 < 0 || x0 > w) {
          continue;
        }
        ctx.fillStyle = cutColor;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x0, 0, Math.max(2, x1 - x0), h);
        ctx.globalAlpha = 1;
      }

      if (selection && durationSec > 0) {
        const x0 = toX(selection.start);
        const x1 = toX(selection.end);
        ctx.fillStyle = selColor;
        ctx.globalAlpha = 0.2;
        ctx.fillRect(x0, 0, Math.max(2, x1 - x0), h);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = selColor;
        ctx.strokeRect(x0, 1, Math.max(2, x1 - x0), h - 2);
      }

      if (durationSec > 0) {
        const px = toX(currentTime);
        if (px >= 0 && px <= w) {
          ctx.strokeStyle = themeColor(
            canvas,
            '--color-foreground',
            'rgba(255,255,255,0.9)',
          );
          ctx.beginPath();
          ctx.moveTo(px, 0);
          ctx.lineTo(px, h);
          ctx.stroke();
        }
      }
    }

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [
    peaks,
    hasPeaks,
    peakMax,
    themeVersion,
    durationSec,
    currentTime,
    cuts,
    selection,
    viewStart,
    viewEnd,
    span,
  ]);

  const wheelRef = useRef({ viewStart, span, durationSec, onViewChange });
  wheelRef.current = { viewStart, span, durationSec, onViewChange };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    // A native listener: React's onWheel is passive, so preventDefault is
    // ignored there and a trackpad's ctrl-wheel pinch zooms the whole page
    // instead of the waveform.
    const onWheel = (e: WheelEvent) => {
      const {
        viewStart: start,
        span: currentSpan,
        durationSec: duration,
        onViewChange: change,
      } = wheelRef.current;
      if (!change || duration <= 0) {
        return;
      }
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cursorFrac = (e.clientX - rect.left) / rect.width;
      const zoom = e.deltaY > 0 ? 1.15 : 0.87;
      const newSpan = Math.min(1, Math.max(MIN_SPAN, currentSpan * zoom));
      const center = start + cursorFrac * currentSpan;
      let ns = center - cursorFrac * newSpan;
      let ne = ns + newSpan;
      if (ns < 0) {
        ne -= ns;
        ns = 0;
      }
      if (ne > 1) {
        ns -= ne - 1;
        ne = 1;
      }
      change(Math.max(0, ns), Math.min(1, ne));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  /** Maps a client-x pixel to a timeline second, accounting for the
   * current zoom window (not the full track). */
  const secFromEvent = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas || durationSec <= 0) {
      return 0;
    }
    const rect = canvas.getBoundingClientRect();
    const frac = (clientX - rect.left) / rect.width;
    const viewSec = (viewStart + frac * span) * durationSec;
    return Math.max(0, Math.min(durationSec, viewSec));
  };

  const finishDrag = (clientX: number) => {
    if (!dragRef.current) {
      return;
    }
    const end = secFromEvent(clientX);
    const start = dragRef.current.startSec;
    dragRef.current = null;
    if (onSelectRange && Math.abs(end - start) > 0.05) {
      onSelectRange(Math.min(start, end), Math.max(start, end));
    } else {
      onSeek(end);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (durationSec <= 0) {
      return;
    }
    const next = (() => {
      switch (event.key) {
        case 'ArrowLeft':
          return currentTime - KEY_STEP_SEC;
        case 'ArrowRight':
          return currentTime + KEY_STEP_SEC;
        case 'PageDown':
          return currentTime - KEY_PAGE_SEC;
        case 'PageUp':
          return currentTime + KEY_PAGE_SEC;
        case 'Home':
          return 0;
        case 'End':
          return durationSec;
        default:
          return null;
      }
    })();
    if (next == null) {
      return;
    }
    event.preventDefault();
    onSeek(Math.max(0, Math.min(durationSec, next)));
  };

  return (
    <canvas
      ref={canvasRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(durationSec)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={`${formatDuration(currentTime)} of ${formatDuration(durationSec)}`}
      data-waveform={hasPeaks ? 'peaks' : 'empty'}
      className="border-border bg-background focus-visible:ring-primary h-56 w-full cursor-crosshair touch-none rounded-md border-2 outline-none focus-visible:ring-2"
      onKeyDown={onKeyDown}
      onPointerDown={(e: PointerEvent<HTMLCanvasElement>) => {
        if (e.button > 0) {
          return;
        }
        e.currentTarget.setPointerCapture?.(e.pointerId);
        const sec = secFromEvent(e.clientX);
        dragRef.current = { startX: e.clientX, startSec: sec };
        onSeek(sec);
      }}
      onPointerMove={(e) => {
        if (!dragRef.current || !onSelectRange) {
          return;
        }
        const end = secFromEvent(e.clientX);
        const start = dragRef.current.startSec;
        onSelectRange(Math.min(start, end), Math.max(start, end));
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        finishDrag(e.clientX);
      }}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
    />
  );
}
