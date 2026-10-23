import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import {
  hasPeaks,
  observeThemeChange,
  peaksToWaveSurfer,
  PLACEHOLDER_PEAKS,
  readCssVar,
} from '@tahti-player/ui';

import { formatClock, type TimeView } from './draw';
import type { WaveformData } from './peaks';

type Range = { start: number; end: number };

type WaveSurferInstance = import('wavesurfer.js').default;
type RegionsInstance = ReturnType<
  (typeof import('wavesurfer.js/dist/plugins/regions.esm.js'))['default']['create']
>;
type RegionInstance = ReturnType<RegionsInstance['getRegions']>[number];

export type EditorWaveSurferPeaks = number[] | WaveformData | null;

export type EditorWaveSurferProps = {
  peaks: EditorWaveSurferPeaks;
  durationSec: number;
  media?: HTMLAudioElement | null;
  playhead: number;
  selection: Range | null;
  onSeek: (sec: number) => void;
  onSelect: (range: Range | null) => void;
  height?: number;
  view?: TimeView;
  onViewChange?: (view: TimeView) => void;
  snap?: (sec: number) => number;
  cuts?: Range[];
  fades?: { type: 'in' | 'out'; at: number; duration: number }[];
  markers?: number[];
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onFallback?: () => void;
  label?: string;
};

const OVERLAY_PREFIX = 'overlay:';
const MAX_POINTS = 16384;
const MAX_ZOOM_PX_PER_SEC = 4000;
const SELECTION_EPSILON = 1e-6;
const PLAYHEAD_EPSILON = 0.02;

function mix(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

export function dataToWaveSurferPeaks(
  data: WaveformData,
): Float32Array[] | null {
  const out: Float32Array[] = [];
  for (const channel of data.channels) {
    const level =
      channel.levels.find((candidate) => candidate.min.length <= MAX_POINTS) ??
      channel.levels[channel.levels.length - 1];
    if (!level || level.min.length === 0) {
      return null;
    }
    const stride = Math.max(1, Math.ceil(level.min.length / MAX_POINTS));
    const count = Math.ceil(level.min.length / stride);
    const points = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      let hi = -Infinity;
      let lo = Infinity;
      const from = i * stride;
      const to = Math.min(level.min.length, from + stride);
      for (let j = from; j < to; j++) {
        hi = Math.max(hi, level.max[j]!);
        lo = Math.min(lo, level.min[j]!);
      }
      points[i * 2] = hi;
      points[i * 2 + 1] = lo;
    }
    out.push(points);
  }
  return out.length > 0 ? out : null;
}

export function resolveWaveSurferPeaks(
  peaks: EditorWaveSurferPeaks,
): (number[] | Float32Array)[] | null {
  if (!peaks) {
    return null;
  }
  if (Array.isArray(peaks)) {
    return hasPeaks(peaks) ? peaksToWaveSurfer(peaks) : null;
  }
  return dataToWaveSurferPeaks(peaks);
}

function editorColors(root: HTMLElement) {
  return {
    wave: readCssVar(root, '--color-accent-cyan', '#22d3ee'),
    progress: readCssVar(root, '--color-primary', '#facc15'),
    cursor: readCssVar(root, '--color-foreground', '#ffffff'),
    muted: readCssVar(root, '--color-foreground-secondary', '#999999'),
    surface: readCssVar(root, '--color-background-secondary', '#1a1a1a'),
  };
}

type Session = {
  ws: WaveSurferInstance;
  regions: RegionsInstance;
};

/** Pro-editor waveform on wavesurfer.js: Regions for the selection, plus
 * Timeline, Minimap, Zoom and Hover. Lazy-loads the library; calls
 * `onFallback` if it cannot start so the caller can show `ProWaveform`. */
export function EditorWaveSurfer({
  peaks,
  durationSec,
  media = null,
  playhead,
  selection,
  onSeek,
  onSelect,
  height = 192,
  view,
  onViewChange,
  snap,
  cuts,
  fades,
  markers,
  onKeyDown,
  onFallback,
  label = 'Waveform',
}: EditorWaveSurferProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<RegionInstance | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [themeVersion, setThemeVersion] = useState(0);
  const heightRef = useRef(height);
  heightRef.current = height;

  const live = useRef({
    onSeek,
    onSelect,
    onViewChange,
    onFallback,
    snap,
    selection,
    view,
    durationSec,
  });
  live.current = {
    onSeek,
    onSelect,
    onViewChange,
    onFallback,
    snap,
    selection,
    view,
    durationSec,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || durationSec <= 0) {
      return;
    }
    let cancelled = false;
    let created: Session | null = null;
    const cleanups: (() => void)[] = [];

    const start = async () => {
      const [
        { default: WaveSurfer },
        { default: Regions },
        { default: Timeline },
        { default: Minimap },
        { default: Zoom },
        { default: Hover },
      ] = await Promise.all([
        import('wavesurfer.js'),
        import('wavesurfer.js/dist/plugins/regions.esm.js'),
        import('wavesurfer.js/dist/plugins/timeline.esm.js'),
        import('wavesurfer.js/dist/plugins/minimap.esm.js'),
        import('wavesurfer.js/dist/plugins/zoom.esm.js'),
        import('wavesurfer.js/dist/plugins/hover.esm.js'),
      ]);
      if (cancelled || !containerRef.current) {
        return;
      }
      const root = containerRef.current;
      const { wave, progress, cursor, muted, surface } = editorColors(root);

      const resolved = resolveWaveSurferPeaks(peaks);
      const regions = Regions.create();
      const ws = WaveSurfer.create({
        container: root,
        height: heightRef.current,
        waveColor: wave,
        progressColor: wave,
        cursorColor: cursor,
        cursorWidth: 1,
        normalize: resolved != null,
        interact: true,
        dragToSeek: false,
        autoScroll: false,
        autoCenter: false,
        duration: durationSec,
        peaks: resolved ?? PLACEHOLDER_PEAKS,
        ...(media ? { media } : {}),
        plugins: [
          regions,
          Timeline.create({
            height: 20,
            style: { color: muted, fontSize: '10px' },
          }),
          Minimap.create({
            height: 36,
            waveColor: muted,
            progressColor: muted,
            overlayColor: mix(progress, 20),
            cursorColor: cursor,
          }),
          Zoom.create({ scale: 0.5, maxZoom: MAX_ZOOM_PX_PER_SEC }),
          Hover.create({
            lineColor: cursor,
            lineWidth: 1,
            labelColor: cursor,
            labelBackground: surface,
            labelSize: '11px',
            formatTimeCallback: (seconds) => formatClock(seconds, 0.001),
          }),
        ],
      });
      created = { ws, regions };

      const failed = () => {
        if (!cancelled) {
          live.current.onFallback?.();
        }
      };
      cleanups.push(ws.on('error', failed));

      cleanups.push(
        ws.on('interaction', (time: number) => {
          const total = live.current.durationSec;
          live.current.onSeek(Math.max(0, Math.min(total, time)));
        }),
      );

      const emitView = () => {
        const handler = live.current.onViewChange;
        const total = live.current.durationSec;
        if (!handler || total <= 0) {
          return;
        }
        const pxPerSec = ws.options.minPxPerSec;
        const next =
          pxPerSec > 0 && ws.getWidth() > 0
            ? (() => {
                const from = Math.max(0, ws.getScroll() / pxPerSec);
                return {
                  start: from,
                  end: Math.min(total, from + ws.getWidth() / pxPerSec),
                };
              })()
            : { start: 0, end: total };
        const current = live.current.view;
        const tolerance = Math.max(1e-6, (next.end - next.start) * 0.005);
        if (
          current &&
          Math.abs(current.start - next.start) < tolerance &&
          Math.abs(current.end - next.end) < tolerance
        ) {
          return;
        }
        handler(next);
      };
      cleanups.push(ws.on('zoom', emitView));
      cleanups.push(ws.on('scroll', emitView));

      cleanups.push(
        regions.on('region-created', (region) => {
          if (region.id.startsWith(OVERLAY_PREFIX)) {
            return;
          }
          const previous = regionRef.current;
          if (previous && previous !== region) {
            regionRef.current = region;
            previous.remove();
          }
          regionRef.current = region;
        }),
      );
      cleanups.push(
        regions.on('region-updated', (region) => {
          if (region.id.startsWith(OVERLAY_PREFIX)) {
            return;
          }
          const adjust = live.current.snap;
          const startSec = adjust ? adjust(region.start) : region.start;
          const endSec = adjust ? adjust(region.end) : region.end;
          live.current.onSelect({
            start: Math.min(startSec, endSec),
            end: Math.max(startSec, endSec),
          });
        }),
      );
      cleanups.push(
        regions.on('region-removed', (region) => {
          if (region.id.startsWith(OVERLAY_PREFIX)) {
            return;
          }
          if (regionRef.current === region) {
            regionRef.current = null;
          }
        }),
      );
      cleanups.push(
        regions.enableDragSelection({
          color: mix(progress, 30),
        }),
      );

      setSession(created);
    };

    start().catch(() => {
      if (!cancelled) {
        live.current.onFallback?.();
      }
    });

    return () => {
      cancelled = true;
      for (const stop of cleanups) {
        try {
          stop();
        } catch {
          continue;
        }
      }
      regionRef.current = null;
      setSession(null);
      try {
        created?.ws.destroy();
      } catch {
        created = null;
      }
    };
  }, [peaks, durationSec, media, themeVersion]);

  useEffect(() => {
    if (session && session.ws.options.height !== height) {
      session.ws.setOptions({ height });
    }
  }, [session, height]);

  // Timeline, Minimap and Hover read their colours only at creation, so a
  // theme switch re-creates the whole instance; selection, overlays and the
  // view are re-applied from props by the effects below.
  useEffect(
    () => observeThemeChange(() => setThemeVersion((version) => version + 1)),
    [],
  );

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) {
      return;
    }
    // The Zoom plugin zooms on every vertical wheel. Only Ctrl/⌘ + wheel
    // (trackpad pinch arrives as ctrl + wheel) may reach it; a plain wheel
    // scrolls the page and Shift + wheel pans the waveform natively.
    const guard = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        event.stopPropagation();
      }
    };
    outer.addEventListener('wheel', guard, { capture: true, passive: true });
    return () => outer.removeEventListener('wheel', guard, { capture: true });
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    const { regions } = session;
    const existing = regionRef.current;
    if (!selection) {
      if (existing) {
        regionRef.current = null;
        existing.remove();
      }
      return;
    }
    if (existing) {
      if (
        Math.abs(existing.start - selection.start) > SELECTION_EPSILON ||
        Math.abs(existing.end - selection.end) > SELECTION_EPSILON
      ) {
        existing.setOptions({ start: selection.start, end: selection.end });
      }
      return;
    }
    const root = containerRef.current;
    const progress = root
      ? readCssVar(root, '--color-primary', '#facc15')
      : '#facc15';
    regions.addRegion({
      start: selection.start,
      end: selection.end,
      color: mix(progress, 30),
      drag: true,
      resize: true,
    });
  }, [session, selection]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const root = containerRef.current;
    const read = (name: string, fallback: string) =>
      root ? readCssVar(root, name, fallback) : fallback;
    const cutColor = mix(read('--color-accent-red', '#ef4444'), 35);
    const fadeInColor = mix(read('--color-accent-cyan', '#22d3ee'), 25);
    const fadeOutColor = mix(read('--color-accent-purple', '#c084fc'), 25);
    const markerColor = read('--color-accent-yellow', '#eab308');
    const added: { remove: () => void }[] = [];
    const place = (
      id: string,
      params: { start: number; end?: number; color: string; content: string },
    ) => {
      const region = session.regions.addRegion({
        id: `${OVERLAY_PREFIX}${id}`,
        drag: false,
        resize: false,
        ...params,
      });
      if (region.element) {
        region.element.style.pointerEvents = 'none';
      }
      added.push(region);
    };
    (cuts ?? []).forEach((cut, index) =>
      place(`cut-${index}`, { ...cut, color: cutColor, content: 'Cut' }),
    );
    (fades ?? []).forEach((fade, index) =>
      place(`fade-${index}`, {
        start: fade.at,
        end: fade.at + fade.duration,
        color: fade.type === 'in' ? fadeInColor : fadeOutColor,
        content: fade.type === 'in' ? 'Fade in' : 'Fade out',
      }),
    );
    (markers ?? []).forEach((at, index) =>
      place(`marker-${index}`, {
        start: at,
        color: markerColor,
        content: `M${index + 1}`,
      }),
    );
    return () => {
      for (const region of added) {
        region.remove();
      }
    };
  }, [session, cuts, fades, markers, themeVersion]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const { ws } = session;
    if (media && !media.paused) {
      return;
    }
    if (Math.abs(ws.getCurrentTime() - playhead) > PLAYHEAD_EPSILON) {
      ws.setTime(Math.max(0, Math.min(durationSec, playhead)));
    }
  }, [session, playhead, media, durationSec]);

  useEffect(() => {
    if (!session || !view || view.end <= view.start) {
      return;
    }
    const { ws } = session;
    const width = ws.getWidth();
    if (width <= 0 || durationSec <= 0) {
      return;
    }
    const span = view.end - view.start;
    const pxPerSec = span >= durationSec * 0.999 ? 0 : width / span;
    const currentPx = ws.options.minPxPerSec;
    if (Math.abs(currentPx - pxPerSec) > Math.max(0.01, pxPerSec * 0.005)) {
      ws.zoom(pxPerSec);
    }
    if (pxPerSec > 0) {
      const scrolled = ws.getScroll() / pxPerSec;
      if (Math.abs(scrolled - view.start) > span * 0.005) {
        ws.setScrollTime(view.start);
      }
    }
  }, [session, view, durationSec]);

  return (
    <div
      ref={outerRef}
      tabIndex={0}
      role="application"
      aria-label={`${label}. Space plays or pauses, arrow keys move the playhead, left and right bracket start and end a selection at the playhead, plus and minus zoom, Z zooms to the selection, Delete cuts it, Escape clears it.`}
      data-testid="editor-wavesurfer"
      onKeyDown={onKeyDown}
      className="border-border bg-background focus-visible:ring-primary relative w-full overflow-hidden rounded-md border-2 outline-none focus-visible:ring-2"
    >
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
