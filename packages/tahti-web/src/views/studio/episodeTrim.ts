export type Cut = { start: number; end: number };

/** "Trim start / end" means *keep* [start, end]; the edit list stores what to
 * *remove*, so the cuts are everything outside that range. `end <= start`
 * (0 = full) means no end trim. Returns [] when nothing is trimmed. */
export function trimToCuts(
  trimStart: number,
  trimEnd: number,
  sourceDuration: number,
): Cut[] {
  const start = Number.isFinite(trimStart) ? Math.max(0, trimStart) : 0;
  const end =
    Number.isFinite(trimEnd) && trimEnd > start
      ? Math.min(trimEnd, sourceDuration)
      : sourceDuration;
  const cuts: Cut[] = [];
  if (start > 0) {
    cuts.push({ start: 0, end: Math.min(start, sourceDuration) });
  }
  if (end < sourceDuration) {
    cuts.push({ start: end, end: sourceDuration });
  }
  return cuts;
}
