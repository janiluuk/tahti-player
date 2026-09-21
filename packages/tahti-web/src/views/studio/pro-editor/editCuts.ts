import type { EditList } from '../../../api/studio-types';

export type Cut = EditList['cuts'][number];

/** Sorted cuts with overlapping/touching ones merged, so the same region is
 * never removed (or counted) twice. */
export function mergeCuts(cuts: readonly Cut[]): Cut[] {
  const sorted = cuts
    .filter((c) => c.end > c.start)
    .map((c) => ({ ...c }))
    .sort((a, b) => a.start - b.start);
  const merged: Cut[] = [];
  for (const cut of sorted) {
    const last = merged[merged.length - 1];
    if (last && cut.start <= last.end) {
      last.end = Math.max(last.end, cut.end);
    } else {
      merged.push(cut);
    }
  }
  return merged;
}

/** Duration left after the cuts are removed. */
export function keptDuration(
  sourceDuration: number,
  cuts: readonly Cut[],
): number {
  const removed = mergeCuts(cuts).reduce(
    (sum, c) => sum + Math.max(0, Math.min(c.end, sourceDuration) - c.start),
    0,
  );
  return Math.max(0, sourceDuration - removed);
}

/** Cuts that keep only `[start, end]`: the head and tail become cuts, and
 * cuts already inside the selection are preserved (clipped to it). */
export function trimToRange(
  cuts: readonly Cut[],
  sourceDuration: number,
  start: number,
  end: number,
): Cut[] {
  const inside = cuts
    .map((c) => ({
      start: Math.max(c.start, start),
      end: Math.min(c.end, end),
    }))
    .filter((c) => c.end > c.start);
  return mergeCuts([
    ...(start > 0.05 ? [{ start: 0, end: start }] : []),
    ...inside,
    ...(end < sourceDuration - 0.05
      ? [{ start: end, end: sourceDuration }]
      : []),
  ]);
}

/** Leading/trailing near-silence as cuts, from bucketed peaks (an
 * approximation — peaks are amplitude buckets, not raw PCM). Empty when
 * there is nothing worth trimming. */
export function silenceCuts(
  peaks: readonly number[],
  sourceDuration: number,
  threshold = 0.06,
): Cut[] {
  if (peaks.length === 0 || sourceDuration <= 0) {
    return [];
  }
  let start = 0;
  while (start < peaks.length && peaks[start]! < threshold) {
    start++;
  }
  if (start === peaks.length) {
    return [];
  }
  let end = peaks.length - 1;
  while (end > start && peaks[end]! < threshold) {
    end--;
  }
  const secPerBucket = sourceDuration / peaks.length;
  const startSec = start * secPerBucket;
  const endSec = (end + 1) * secPerBucket;
  const cuts: Cut[] = [];
  if (startSec > 0.3) {
    cuts.push({ start: 0, end: startSec });
  }
  if (sourceDuration - endSec > 0.3) {
    cuts.push({ start: endSec, end: sourceDuration });
  }
  return cuts;
}

/** Zoomed view range for a toolbar zoom step, anchored on the view's
 * centre. `factor` > 1 zooms out, < 1 in. */
export function zoomRange(
  viewStart: number,
  viewEnd: number,
  factor: number,
  minSpan = 0.005,
): [number, number] {
  const span = Math.max(minSpan, viewEnd - viewStart);
  const center = viewStart + span / 2;
  const nextSpan = Math.min(1, Math.max(minSpan, span * factor));
  let start = center - nextSpan / 2;
  let end = start + nextSpan;
  if (start < 0) {
    end -= start;
    start = 0;
  }
  if (end > 1) {
    start -= end - 1;
    end = 1;
  }
  return [Math.max(0, start), Math.min(1, end)];
}
