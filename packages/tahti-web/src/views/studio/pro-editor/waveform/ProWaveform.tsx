import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import {
  drawOverlay,
  drawWaveformLayer,
  readPalette,
  type OverlayState,
  type Palette,
  type TimeView,
} from './draw';
import type { WaveformData } from './peaks';
import { panBy, zoomAt } from './viewMath';

export type ProWaveformHandle = {
  /** Moves the playhead without a React render (used every frame while
   * playing). */
  setPlayhead: (sec: number) => void;
};

type Range = { start: number; end: number };

type Props = {
  data: WaveformData | null;
  durationSec: number;
  view: TimeView;
  minSpan: number;
  onViewChange: (view: TimeView) => void;
  overlay: Omit<OverlayState, 'playhead' | 'durationSec'>;
  playhead: number;
  onSeek: (sec: number) => void;
  onSelect: (range: Range | null) => void;
  /** Adjusts a selection edge (e.g. to the nearest zero crossing). */
  snap: (sec: number) => number;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  label?: string;
};

type Drag =
  | { kind: 'new'; anchor: number; startX: number; moved: boolean }
  | { kind: 'edge'; fixed: number };

/** Pixels either side of a selection edge that grab it. */
const EDGE_GRAB_PX = 6;

/** Sample-accurate waveform: a waveform canvas (redrawn only when the data,
 * zoom or size changes) under an overlay canvas for cuts, fades, the
 * selection, markers and the playhead (cheap, redrawn every frame while
 * playing). Click seeks, drag selects, drag an edge (or shift-click) to
 * adjust the selection; ctrl/⌘ + scroll or pinch zooms at the cursor,
 * shift + scroll or a horizontal scroll pans. */
export const ProWaveform = forwardRef<ProWaveformHandle, Props>(
  function ProWaveform(
    {
      data,
      durationSec,
      view,
      minSpan,
      onViewChange,
      overlay,
      playhead,
      onSeek,
      onSelect,
      snap,
      onKeyDown,
      label = 'Waveform',
    },
    ref,
  ) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const waveRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const paletteRef = useRef<Palette | null>(null);
    const dragRef = useRef<Drag | null>(null);
    const pointerPositions = useRef(
      new Map<number, { x: number; y: number }>(),
    );
    const pinchRef = useRef<{ distance: number } | null>(null);
    const [layoutTick, setLayoutTick] = useState(0);

    const distance = (map: Map<number, { x: number; y: number }>): number => {
      const [a, b] = [...map.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };

    /** Zooms by `factor` (from a two-finger pinch) around the fingers'
     * midpoint, read as seconds under the current view. */
    const pinchZoom = (midX: number, factor: number): void => {
      const wrapper = wrapperRef.current;
      const { view: current, durationSec: duration } = latest.current;
      if (!wrapper || duration <= 0) {
        return;
      }
      const rect = wrapper.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }
      const frac = (midX - rect.left) / rect.width;
      const anchor = Math.max(
        0,
        Math.min(
          duration,
          current.start + frac * (current.end - current.start),
        ),
      );
      onViewChange(zoomAt(current, duration, anchor, factor, minSpan));
    };

    const latest = useRef({ view, overlay, playhead, durationSec });
    latest.current.view = view;
    latest.current.overlay = overlay;
    latest.current.durationSec = durationSec;

    const paintOverlay = () => {
      const canvas = overlayRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || !paletteRef.current) {
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      drawOverlay(
        ctx,
        canvas.width,
        canvas.height,
        dpr,
        latest.current.view,
        {
          ...latest.current.overlay,
          durationSec: latest.current.durationSec,
          playhead: latest.current.playhead,
        },
        paletteRef.current,
      );
    };

    useImperativeHandle(ref, () => ({
      setPlayhead: (sec: number) => {
        latest.current.playhead = sec;
        paintOverlay();
      },
    }));

    useEffect(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) {
        return;
      }
      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(wrapper.clientWidth * dpr));
        const height = Math.max(1, Math.floor(wrapper.clientHeight * dpr));
        for (const canvas of [waveRef.current, overlayRef.current]) {
          if (canvas && (canvas.width !== width || canvas.height !== height)) {
            canvas.width = width;
            canvas.height = height;
          }
        }
        paletteRef.current = readPalette(wrapper);
        setLayoutTick((tick) => tick + 1);
      };
      resize();
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(wrapper);
      const themeObserver = new MutationObserver(resize);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme'],
      });
      return () => {
        resizeObserver.disconnect();
        themeObserver.disconnect();
      };
    }, []);

    useEffect(() => {
      const canvas = waveRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || !paletteRef.current) {
        return;
      }
      drawWaveformLayer(
        ctx,
        canvas.width,
        canvas.height,
        window.devicePixelRatio || 1,
        data,
        view,
        paletteRef.current,
      );
    }, [data, view, layoutTick]);

    useEffect(() => {
      latest.current.playhead = playhead;
      paintOverlay();
    }, [overlay, view, playhead, layoutTick, durationSec]);

    useEffect(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) {
        return;
      }
      // A native listener: React's onWheel is passive, so it cannot stop
      // ctrl + scroll from zooming the whole page.
      const onWheel = (event: WheelEvent) => {
        const { view: current, durationSec: duration } = latest.current;
        if (duration <= 0) {
          return;
        }
        const scale =
          event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
        const dx = event.deltaX * scale;
        const dy = event.deltaY * scale;
        const rect = wrapper.getBoundingClientRect();
        const span = current.end - current.start;
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          const anchor =
            current.start + ((event.clientX - rect.left) / rect.width) * span;
          onViewChange(
            zoomAt(current, duration, anchor, Math.exp(dy * 0.0025), minSpan),
          );
          return;
        }
        const horizontal = event.shiftKey ? dy || dx : dx;
        if (event.shiftKey || Math.abs(dx) > Math.abs(dy)) {
          event.preventDefault();
          onViewChange(
            panBy(current, duration, (horizontal / rect.width) * span, minSpan),
          );
        }
      };
      wrapper.addEventListener('wheel', onWheel, { passive: false });
      return () => wrapper.removeEventListener('wheel', onWheel);
    }, [onViewChange, minSpan]);

    const secAt = (clientX: number) => {
      const wrapper = wrapperRef.current;
      if (!wrapper || durationSec <= 0) {
        return 0;
      }
      const rect = wrapper.getBoundingClientRect();
      const frac = (clientX - rect.left) / rect.width;
      const sec = view.start + frac * (view.end - view.start);
      return Math.max(0, Math.min(durationSec, sec));
    };

    const edgeNear = (clientX: number): number | null => {
      const selection = overlay.selection;
      const wrapper = wrapperRef.current;
      if (!selection || !wrapper) {
        return null;
      }
      const secPerPx = (view.end - view.start) / wrapper.clientWidth;
      const sec = secAt(clientX);
      const grab = EDGE_GRAB_PX * secPerPx;
      if (Math.abs(sec - selection.start) <= grab) {
        return selection.end;
      }
      if (Math.abs(sec - selection.end) <= grab) {
        return selection.start;
      }
      return null;
    };

    const emitRange = (a: number, b: number) =>
      onSelect({ start: Math.min(a, b), end: Math.max(a, b) });

    return (
      <div
        ref={wrapperRef}
        tabIndex={0}
        role="application"
        aria-label={`${label}. Space plays or pauses, arrow keys move the playhead, plus and minus zoom, Z zooms to the selection, Delete cuts it, Escape clears it.`}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }
          const map = pointerPositions.current;
          map.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (map.size === 2) {
            // A second finger on the waveform means pinch, not a drag.
            pinchRef.current = { distance: distance(map) };
            dragRef.current = null;
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }
        }}
        onPointerMove={(event) => {
          const map = pointerPositions.current;
          if (!map.has(event.pointerId)) {
            return;
          }
          map.set(event.pointerId, { x: event.clientX, y: event.clientY });
          const pinch = pinchRef.current;
          if (!pinch || map.size < 2) {
            return;
          }
          const next = distance(map);
          if (pinch.distance > 0 && next > 0) {
            let midX = 0;
            for (const point of map.values()) {
              midX += point.x;
            }
            pinchZoom(midX / map.size, pinch.distance / next);
          }
          pinchRef.current = { distance: next };
        }}
        onPointerUp={(event) => {
          pointerPositions.current.delete(event.pointerId);
          if (pointerPositions.current.size < 2) {
            pinchRef.current = null;
          }
        }}
        onPointerCancel={(event) => {
          pointerPositions.current.delete(event.pointerId);
          if (pointerPositions.current.size < 2) {
            pinchRef.current = null;
          }
        }}
        className="border-border bg-background focus-visible:ring-primary relative h-64 w-full touch-none overflow-hidden rounded-md border-2 outline-none select-none focus-visible:ring-2"
      >
        <canvas
          ref={waveRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        <canvas
          ref={overlayRef}
          aria-hidden
          className="absolute inset-0 h-full w-full cursor-crosshair"
          onPointerDown={(event) => {
            if (event.button !== 0) {
              return;
            }
            if (pointerPositions.current.size > 0) {
              // Second finger: the wrapper's pinch handler takes over.
              return;
            }
            wrapperRef.current?.focus({ preventScroll: true });
            event.currentTarget.setPointerCapture?.(event.pointerId);
            const sec = secAt(event.clientX);
            const selection = overlay.selection;
            if (event.shiftKey && selection) {
              const fixed =
                Math.abs(sec - selection.start) < Math.abs(sec - selection.end)
                  ? selection.end
                  : selection.start;
              dragRef.current = { kind: 'edge', fixed };
              emitRange(fixed, snap(sec));
              return;
            }
            const fixed = edgeNear(event.clientX);
            dragRef.current =
              fixed !== null
                ? { kind: 'edge', fixed }
                : {
                    kind: 'new',
                    anchor: snap(sec),
                    startX: event.clientX,
                    moved: false,
                  };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag) {
              event.currentTarget.style.cursor =
                edgeNear(event.clientX) !== null ? 'col-resize' : 'crosshair';
              return;
            }
            const sec = snap(secAt(event.clientX));
            if (drag.kind === 'edge') {
              emitRange(drag.fixed, sec);
              return;
            }
            if (!drag.moved && Math.abs(event.clientX - drag.startX) < 3) {
              return;
            }
            drag.moved = true;
            emitRange(drag.anchor, sec);
          }}
          onPointerUp={(event) => {
            const drag = dragRef.current;
            dragRef.current = null;
            event.currentTarget.releasePointerCapture?.(event.pointerId);
            if (drag?.kind === 'new' && !drag.moved) {
              onSelect(null);
              onSeek(secAt(event.clientX));
            }
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
        />
      </div>
    );
  },
);
