import type { EditList } from '../../../../api/studio-types';
import { peakInRange, type WaveformData } from './peaks';

export type TimeView = { start: number; end: number };

export type Palette = {
  wave: string;
  clip: string;
  grid: string;
  text: string;
  rulerBg: string;
  cut: string;
  selection: string;
  playhead: string;
  marker: string;
};

/** Ruler height in CSS pixels. */
export const RULER_CSS_PX = 20;

/** A sample is drawn as a dot once it is at least this many device pixels
 * wide. */
const SAMPLE_DOT_PX = 6;

const token = (el: Element, name: string, fallback: string) =>
  getComputedStyle(el).getPropertyValue(name).trim() || fallback;

/** Theme colors, read once per theme/size change rather than per frame. */
export function readPalette(el: Element): Palette {
  return {
    wave: token(el, '--color-accent-cyan', '#22d3ee'),
    clip: token(el, '--color-accent-red', '#ef4444'),
    grid: token(el, '--color-border', '#444'),
    text: token(el, '--color-foreground-secondary', '#999'),
    rulerBg: token(el, '--color-background-secondary', '#1a1a1a'),
    cut: token(el, '--color-accent-red', '#ef4444'),
    selection: token(el, '--color-primary', '#facc15'),
    playhead: token(el, '--color-foreground', '#fff'),
    marker: token(el, '--color-accent-yellow', '#eab308'),
  };
}

const TICK_STEPS = [
  0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5,
  1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600,
];

/** `m:ss`, with as many decimals as `step` needs (down to 0.1 ms). */
export function formatClock(sec: number, step = 1): string {
  const safe = Math.max(0, Number.isFinite(sec) ? sec : 0);
  const decimals =
    step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(step) - 1e-9));
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(safe * factor) / factor;
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded - minutes * 60;
  const whole = Math.floor(seconds);
  const fraction =
    decimals > 0
      ? `.${Math.round((seconds - whole) * factor)
          .toString()
          .padStart(decimals, '0')}`
      : '';
  return `${minutes}:${whole.toString().padStart(2, '0')}${fraction}`;
}

/** Labelled and minor ruler ticks for `view` across `widthPx`: the
 * smallest "nice" step whose labels are at least `minLabelPx` apart. */
export function rulerTicks(
  view: TimeView,
  widthPx: number,
  minLabelPx = 90,
): { step: number; major: number[]; minor: number[] } {
  const span = view.end - view.start;
  if (span <= 0 || widthPx <= 0) {
    return { step: 1, major: [], minor: [] };
  }
  const pxPerSec = widthPx / span;
  const step =
    TICK_STEPS.find((candidate) => candidate * pxPerSec >= minLabelPx) ??
    TICK_STEPS[TICK_STEPS.length - 1]!;
  const minorStep = step / (String(step).includes('5') ? 5 : 4);
  const major: number[] = [];
  const minor: number[] = [];
  const first = Math.ceil(view.start / minorStep - 1e-9);
  const last = Math.floor(view.end / minorStep + 1e-9);
  const perMajor = Math.round(step / minorStep);
  for (let i = first; i <= last; i++) {
    const sec = i * minorStep;
    if (i % perMajor === 0) {
      major.push(sec);
    } else {
      minor.push(sec);
    }
  }
  return { step, major, minor };
}

type Lane = { top: number; height: number; mid: number; half: number };

function lanes(count: number, top: number, height: number, gap: number) {
  const laneHeight = (height - gap * (count - 1)) / Math.max(1, count);
  return Array.from({ length: Math.max(1, count) }, (_, i): Lane => {
    const laneTop = top + i * (laneHeight + gap);
    return {
      top: laneTop,
      height: laneHeight,
      mid: laneTop + laneHeight / 2,
      half: laneHeight / 2 - 2,
    };
  });
}

function drawRuler(
  ctx: CanvasRenderingContext2D,
  width: number,
  dpr: number,
  view: TimeView,
  palette: Palette,
) {
  const height = RULER_CSS_PX * dpr;
  ctx.fillStyle = palette.rulerBg;
  ctx.fillRect(0, 0, width, height);
  const { step, major, minor } = rulerTicks(view, width / dpr);
  const toX = (sec: number) =>
    ((sec - view.start) / (view.end - view.start)) * width;
  ctx.fillStyle = palette.grid;
  for (const sec of minor) {
    ctx.fillRect(Math.round(toX(sec)), height - 4 * dpr, dpr, 4 * dpr);
  }
  ctx.fillStyle = palette.text;
  ctx.font = `${10 * dpr}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textBaseline = 'top';
  for (const sec of major) {
    const x = Math.round(toX(sec));
    ctx.fillRect(x, height - 8 * dpr, dpr, 8 * dpr);
    ctx.fillText(formatClock(sec, step), x + 3 * dpr, 2 * dpr);
  }
  ctx.fillStyle = palette.grid;
  ctx.fillRect(0, height - dpr, width, dpr);
}

/** The waveform itself: ruler, per-channel lanes with centre and -6 dB
 * lines, min/max envelope with the RMS body drawn on top, clipped columns
 * in the clip colour, and individual samples (line + dots) once zoomed in
 * past one sample per pixel. Sizes are device pixels. */
export function drawWaveformLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
  data: WaveformData | null,
  view: TimeView,
  palette: Palette,
) {
  ctx.clearRect(0, 0, width, height);
  drawRuler(ctx, width, dpr, view, palette);
  const top = RULER_CSS_PX * dpr;
  const channelLanes = lanes(
    data?.channels.length ?? 1,
    top + 2 * dpr,
    height - top - 2 * dpr,
    4 * dpr,
  );

  ctx.fillStyle = palette.grid;
  for (const lane of channelLanes) {
    ctx.globalAlpha = 0.7;
    ctx.fillRect(0, Math.round(lane.mid), width, dpr);
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, Math.round(lane.mid - lane.half / 2), width, dpr);
    ctx.fillRect(0, Math.round(lane.mid + lane.half / 2), width, dpr);
  }
  ctx.globalAlpha = 1;

  if (!data || data.length === 0 || view.end <= view.start) {
    return;
  }

  const startSample = view.start * data.sampleRate;
  const samplesPerPx = ((view.end - view.start) * data.sampleRate) / width;

  data.channels.forEach((channel, index) => {
    const lane = channelLanes[index]!;
    const y = (v: number) =>
      lane.mid - Math.max(-1, Math.min(1, v)) * lane.half;

    if (samplesPerPx < 1 && channel.raw) {
      const raw = channel.raw;
      const first = Math.max(0, Math.floor(startSample) - 1);
      const last = Math.min(
        raw.length - 1,
        Math.ceil(startSample + width * samplesPerPx) + 1,
      );
      const xOf = (i: number) => (i - startSample) / samplesPerPx;
      ctx.strokeStyle = palette.wave;
      ctx.lineWidth = Math.max(1, dpr);
      ctx.beginPath();
      for (let i = first; i <= last; i++) {
        if (i === first) {
          ctx.moveTo(xOf(i), y(raw[i]!));
        } else {
          ctx.lineTo(xOf(i), y(raw[i]!));
        }
      }
      ctx.stroke();
      if (1 / samplesPerPx >= SAMPLE_DOT_PX * dpr) {
        const radius = 2 * dpr;
        for (let i = first; i <= last; i++) {
          const v = raw[i]!;
          ctx.fillStyle = Math.abs(v) >= 0.999 ? palette.clip : palette.wave;
          ctx.beginPath();
          ctx.arc(xOf(i), y(v), radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }

    const envelope = new Path2D();
    const body = new Path2D();
    const clipped = new Path2D();
    for (let x = 0; x < width; x++) {
      const s0 = startSample + x * samplesPerPx;
      const peak = peakInRange(channel, s0, s0 + samplesPerPx);
      if (!peak || !Number.isFinite(peak.min)) {
        continue;
      }
      const yTop = y(peak.max);
      const yBottom = y(peak.min);
      const h = Math.max(dpr, yBottom - yTop);
      const isClipped = data.exact && (peak.max >= 0.999 || peak.min <= -0.999);
      (isClipped ? clipped : envelope).rect(x, yTop, 1, h);
      if (peak.rms !== null && peak.rms > 0) {
        const rTop = Math.max(yTop, y(peak.rms));
        const rBottom = Math.min(yBottom, y(-peak.rms));
        if (rBottom > rTop) {
          body.rect(x, rTop, 1, rBottom - rTop);
        }
      }
    }
    ctx.fillStyle = palette.wave;
    ctx.globalAlpha = data.exact ? 0.55 : 0.8;
    ctx.fill(envelope);
    ctx.globalAlpha = 1;
    ctx.fill(body);
    ctx.fillStyle = palette.clip;
    ctx.fill(clipped);
  });
}

export type OverlayState = {
  durationSec: number;
  cuts: EditList['cuts'];
  fades: EditList['fades'];
  selection: { start: number; end: number } | null;
  markers: number[];
  playhead: number;
};

/** Cuts, fade curves, selection, markers and the playhead over the
 * waveform. Cheap enough to redraw every animation frame. */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
  view: TimeView,
  state: OverlayState,
  palette: Palette,
) {
  ctx.clearRect(0, 0, width, height);
  const span = view.end - view.start;
  if (span <= 0) {
    return;
  }
  const toX = (sec: number) => ((sec - view.start) / span) * width;
  const top = RULER_CSS_PX * dpr;
  const visible = (a: number, b: number) => toX(b) >= 0 && toX(a) <= width;

  for (const cut of state.cuts) {
    if (!visible(cut.start, cut.end)) {
      continue;
    }
    const x0 = toX(cut.start);
    const w = Math.max(dpr, toX(cut.end) - x0);
    ctx.fillStyle = palette.cut;
    ctx.globalAlpha = 0.28;
    ctx.fillRect(x0, top, w, height - top);
    ctx.globalAlpha = 0.9;
    ctx.fillRect(x0, top - 3 * dpr, w, 3 * dpr);
  }
  ctx.globalAlpha = 1;

  for (const fade of state.fades) {
    const end = fade.at + fade.duration;
    if (!visible(fade.at, end)) {
      continue;
    }
    const x0 = toX(fade.at);
    const x1 = toX(end);
    const steps = Math.max(2, Math.min(200, Math.round(Math.abs(x1 - x0) / 4)));
    const gainAt = (t: number) => {
      const g = fade.type === 'in' ? t : 1 - t;
      return fade.curve === 'exp' ? g * g : g;
    };
    const curve = new Path2D();
    const shade = new Path2D();
    shade.moveTo(x0, top);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + (x1 - x0) * t;
      const yy = top + (1 - gainAt(t)) * (height - top);
      if (i === 0) {
        curve.moveTo(x, yy);
      } else {
        curve.lineTo(x, yy);
      }
      shade.lineTo(x, yy);
    }
    shade.lineTo(x1, top);
    shade.closePath();
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 0.25;
    ctx.fill(shade);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = palette.marker;
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke(curve);
  }

  if (state.selection && visible(state.selection.start, state.selection.end)) {
    const x0 = toX(state.selection.start);
    const x1 = toX(state.selection.end);
    ctx.fillStyle = palette.selection;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(x0, top, Math.max(dpr, x1 - x0), height - top);
    ctx.globalAlpha = 1;
    ctx.fillRect(Math.round(x0), top, dpr, height - top);
    ctx.fillRect(Math.round(x1), top, dpr, height - top);
  }

  ctx.fillStyle = palette.marker;
  for (const marker of state.markers) {
    const x = Math.round(toX(marker));
    if (x < 0 || x > width) {
      continue;
    }
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x, top, dpr, height - top);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + 7 * dpr, top - 5 * dpr);
    ctx.lineTo(x, top - 10 * dpr);
    ctx.closePath();
    ctx.fill();
  }

  const px = toX(state.playhead);
  if (px >= 0 && px <= width) {
    ctx.fillStyle = palette.playhead;
    ctx.fillRect(Math.round(px), 0, Math.max(1, Math.round(1.5 * dpr)), height);
    ctx.beginPath();
    ctx.moveTo(px - 5 * dpr, 0);
    ctx.lineTo(px + 5 * dpr, 0);
    ctx.lineTo(px, 7 * dpr);
    ctx.closePath();
    ctx.fill();
  }
}
