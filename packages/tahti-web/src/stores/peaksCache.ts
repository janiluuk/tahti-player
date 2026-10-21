/** Waveform peaks remembered per playable id so queue skips keep real
 * waveforms. Bounded: the least recently stored ids are dropped first. */
export type PeaksCache = Record<string, number[]>;

export const PEAKS_CACHE_LIMIT = 200;

export function rememberPeaks(
  cache: PeaksCache,
  id: string,
  peaks: readonly number[] | null | undefined,
  limit = PEAKS_CACHE_LIMIT,
): PeaksCache {
  if (!peaks?.length) {
    return cache;
  }
  const next: PeaksCache = {};
  const kept = Object.keys(cache).filter((key) => key !== id);
  for (const key of kept.slice(Math.max(0, kept.length - (limit - 1)))) {
    next[key] = cache[key]!;
  }
  next[id] = [...peaks];
  return next;
}

export function peaksFor(cache: PeaksCache, id: string): number[] | null {
  return cache[id] ?? null;
}
