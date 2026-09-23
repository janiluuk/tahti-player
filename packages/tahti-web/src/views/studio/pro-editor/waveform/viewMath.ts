import type { TimeView } from './draw';

/** Fewest samples the view can be zoomed down to. */
export const MIN_VIEW_SAMPLES = 32;

/** Narrowest view span in seconds for a source at `sampleRate`. */
export const minSpanSec = (sampleRate: number) =>
  MIN_VIEW_SAMPLES / Math.max(1, sampleRate);

/** `view` moved/shrunk to lie inside [0, duration] with at least
 * `minSpan` seconds visible. */
export function clampView(
  view: TimeView,
  duration: number,
  minSpan: number,
): TimeView {
  if (duration <= 0) {
    return { start: 0, end: 0 };
  }
  const span = Math.min(duration, Math.max(minSpan, view.end - view.start));
  const start = Math.min(Math.max(0, view.start), duration - span);
  return { start, end: start + span };
}

/** Zoom by `factor` (> 1 out, < 1 in) keeping `anchor` (seconds) at the
 * same place on screen. */
export function zoomAt(
  view: TimeView,
  duration: number,
  anchor: number,
  factor: number,
  minSpan: number,
): TimeView {
  const span = view.end - view.start;
  const nextSpan = Math.min(duration, Math.max(minSpan, span * factor));
  const ratio = span > 0 ? (anchor - view.start) / span : 0.5;
  const start = anchor - ratio * nextSpan;
  return clampView({ start, end: start + nextSpan }, duration, minSpan);
}

export function panBy(
  view: TimeView,
  duration: number,
  deltaSec: number,
  minSpan: number,
): TimeView {
  return clampView(
    { start: view.start + deltaSec, end: view.end + deltaSec },
    duration,
    minSpan,
  );
}

/** A view showing `range` with a little room either side. */
export function viewForRange(
  range: { start: number; end: number },
  duration: number,
  minSpan: number,
): TimeView {
  const pad = (range.end - range.start) * 0.05;
  return clampView(
    { start: range.start - pad, end: range.end + pad },
    duration,
    minSpan,
  );
}

/** Pages the view forward (or back) when the playhead leaves it, the way
 * DAWs follow playback; unchanged while the playhead is on screen. */
export function followPlayhead(
  view: TimeView,
  duration: number,
  time: number,
  minSpan: number,
): TimeView {
  if (time >= view.start && time <= view.end) {
    return view;
  }
  const span = view.end - view.start;
  return clampView({ start: time, end: time + span }, duration, minSpan);
}
