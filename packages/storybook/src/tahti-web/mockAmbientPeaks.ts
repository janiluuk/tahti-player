/** Synthetic [0..255] peaks for Storybook demos - not real audio. */
export function mockAmbientPeaks(seed = 1, count = 96): number[] {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + seed * 7) / count;
    const wave =
      0.35 +
      0.45 * Math.abs(Math.sin(t * Math.PI * 4 + seed)) +
      0.2 * Math.abs(Math.sin(t * Math.PI * 11));
    return Math.round(40 + wave * 200);
  });
}
