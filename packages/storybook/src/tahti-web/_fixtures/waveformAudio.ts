const sampleRate = 8000;
export const WAVEFORM_DEMO_DURATION = 3;
const samples = Array.from(
  { length: sampleRate * WAVEFORM_DEMO_DURATION },
  (_, i) => {
    const t = i / sampleRate;
    const envelope =
      t > 1.2 && t < 1.5
        ? 0
        : (0.2 + 0.8 * Math.abs(Math.sin(t * 3))) *
          Math.min(1, t * 8, (3 - t) * 5);
    return Math.round(Math.sin(t * Math.PI * 440) * envelope * 32767);
  },
);
export const WAVEFORM_DEMO_PEAKS = Array.from({ length: 4096 }, (_, i) => {
  const start = Math.floor((i * samples.length) / 4096);
  const end = Math.floor(((i + 1) * samples.length) / 4096);
  return Math.round(
    (Math.max(...samples.slice(start, end).map(Math.abs)) / 32767) * 255,
  );
});
