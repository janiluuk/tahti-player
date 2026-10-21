/** Convert tahti-org `[0..255]` amplitude buckets to wavesurfer channel peaks
 * (`-1..1` floats). One channel; values are mirrored around zero so mirrored
 * bars render symmetrically. */
export function peaksToWaveSurfer(peaks: number[]): number[][] {
  if (peaks.length === 0) {
    return [[]];
  }
  const max = Math.max(1, ...peaks);
  return [
    peaks.map((value) => {
      const normalized = Math.min(1, Math.max(0, value / max));
      return normalized * 2 - 1;
    }),
  ];
}

export function hasPeaks(peaks: number[] | null | undefined): boolean {
  return Boolean(peaks && peaks.length > 0);
}
