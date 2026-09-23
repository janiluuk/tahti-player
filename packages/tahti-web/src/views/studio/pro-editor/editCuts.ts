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
