import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import type { EditList } from '../../../../api/studio-types';
import { readPalette, type TimeView } from './draw';
import { peakInRange, type WaveformData } from './peaks';
import { clampView } from './viewMath';

export type ProMinimapHandle = { setPlayhead: (sec: number) => void };

type Props = {
  data: WaveformData | null;
  durationSec: number;
  view: TimeView;
  minSpan: number;
  cuts: EditList['cuts'];
  playhead: number;
  onViewChange: (view: TimeView) => void;
};

/** Whole-track overview under the waveform: envelope, cuts, the zoomed
 * window and the playhead. Click or drag moves the zoomed window there. */
export const ProMinimap = forwardRef<ProMinimapHandle, Props>(
  function ProMinimap(
    { data, durationSec, view, minSpan, cuts, playhead, onViewChange },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playheadRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef(false);
    const [layoutTick, setLayoutTick] = useState(0);

    const placePlayhead = (sec: number) => {
      const el = playheadRef.current;
      if (el) {
        el.style.left = `${durationSec > 0 ? (sec / durationSec) * 100 : 0}%`;
      }
    };

    useImperativeHandle(ref, () => ({ setPlayhead: placePlayhead }));

    useEffect(() => placePlayhead(playhead), [playhead, durationSec]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const observer = new ResizeObserver(() => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
        setLayoutTick((tick) => tick + 1);
      });
      observer.observe(canvas);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) {
        return;
      }
      const palette = readPalette(canvas);
      const { width, height } = canvas;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, width, height);
      const mid = height / 2;
      const half = height / 2 - dpr;
      if (data && data.length > 0 && durationSec > 0) {
        const perPx = (durationSec * data.sampleRate) / width;
        ctx.fillStyle = palette.wave;
        ctx.globalAlpha = 0.6;
        const path = new Path2D();
        for (let x = 0; x < width; x++) {
          let lo = 0;
          let hi = 0;
          for (const channel of data.channels) {
            const peak = peakInRange(channel, x * perPx, (x + 1) * perPx);
            if (peak && Number.isFinite(peak.min)) {
              lo = Math.min(lo, peak.min);
              hi = Math.max(hi, peak.max);
            }
          }
          const top = mid - hi * half;
          path.rect(x, top, 1, Math.max(dpr, mid - lo * half - top));
        }
        ctx.fill(path);
        ctx.globalAlpha = 1;
      }
      if (durationSec > 0) {
        const toX = (sec: number) => (sec / durationSec) * width;
        ctx.fillStyle = palette.cut;
        ctx.globalAlpha = 0.35;
        for (const cut of cuts) {
          ctx.fillRect(
            toX(cut.start),
            0,
            Math.max(dpr, toX(cut.end) - toX(cut.start)),
            height,
          );
        }
        ctx.globalAlpha = 1;
        const x0 = toX(view.start);
        const x1 = toX(view.end);
        ctx.fillStyle = palette.selection;
        ctx.globalAlpha = 0.12;
        ctx.fillRect(x0, 0, Math.max(2 * dpr, x1 - x0), height);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = palette.selection;
        ctx.lineWidth = 2 * dpr;
        ctx.strokeRect(
          x0 + dpr,
          dpr,
          Math.max(2 * dpr, x1 - x0 - 2 * dpr),
          height - 2 * dpr,
        );
      }
    }, [data, durationSec, view, cuts, layoutTick]);

    const moveViewTo = (clientX: number) => {
      const canvas = canvasRef.current;
      if (!canvas || durationSec <= 0) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const center =
        Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) *
        durationSec;
      const span = view.end - view.start;
      onViewChange(
        clampView(
          { start: center - span / 2, end: center + span / 2 },
          durationSec,
          minSpan,
        ),
      );
    };

    return (
      <div className="relative h-8 w-full">
        <canvas
          ref={canvasRef}
          aria-label="Track overview — click or drag to move the zoomed view"
          className="border-border bg-background h-full w-full cursor-pointer touch-none rounded-md border"
          onPointerDown={(event) => {
            draggingRef.current = true;
            event.currentTarget.setPointerCapture?.(event.pointerId);
            moveViewTo(event.clientX);
          }}
          onPointerMove={(event) => {
            if (draggingRef.current) {
              moveViewTo(event.clientX);
            }
          }}
          onPointerUp={(event) => {
            draggingRef.current = false;
            event.currentTarget.releasePointerCapture?.(event.pointerId);
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
        />
        <div
          ref={playheadRef}
          aria-hidden
          className="bg-foreground pointer-events-none absolute top-0 h-full w-px"
        />
      </div>
    );
  },
);
