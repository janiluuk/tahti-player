/** Convert tahti-org `[0..255]` amplitude buckets to one wavesurfer channel of
 * `0..1` magnitudes. wavesurfer draws bars from `|value|` and mirrors them
 * around the centre, so the values must stay non-negative: a signed `-1..1`
 * mapping would draw silence as full-height bars. */
export function peaksToWaveSurfer(peaks: number[]): number[][] {
  if (peaks.length === 0) {
    return [[]];
  }
  let max = 1;
  for (const value of peaks) {
    if (value > max) {
      max = value;
    }
  }
  return [peaks.map((value) => Math.min(1, Math.max(0, value / max)))];
}

export function hasPeaks(peaks: number[] | null | undefined): boolean {
  return Boolean(peaks && peaks.length > 0);
}

/** Cheap content key so callers that rebuild the same peaks array each render
 * do not re-create the waveform. */
export function peaksKey(peaks: number[] | null | undefined): string {
  if (!peaks || peaks.length === 0) {
    return 'empty';
  }
  let hash = 0;
  for (const value of peaks) {
    hash = (hash * 31 + Math.round(value)) | 0;
  }
  return `${peaks.length}:${hash}`;
}

/** Flat channel drawn while a track has no stored peaks. */
export const PLACEHOLDER_PEAKS: number[][] = [
  Array.from({ length: 64 }, () => 0.08),
];
