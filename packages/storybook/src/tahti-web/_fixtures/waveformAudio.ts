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
const bytes = new Uint8Array(44 + samples.length * 2);
const view = new DataView(bytes.buffer);
const text = (offset: number, value: string) => {
  Array.from(value).forEach((char, index) =>
    view.setUint8(offset + index, char.charCodeAt(0)),
  );
};
text(0, 'RIFF');
view.setUint32(4, bytes.length - 8, true);
text(8, 'WAVE');
text(12, 'fmt ');
view.setUint32(16, 16, true);
view.setUint16(20, 1, true);
view.setUint16(22, 1, true);
view.setUint32(24, sampleRate, true);
view.setUint32(28, sampleRate * 2, true);
view.setUint16(32, 2, true);
view.setUint16(34, 16, true);
text(36, 'data');
view.setUint32(40, samples.length * 2, true);
samples.forEach((sample, i) => view.setInt16(44 + i * 2, sample, true));
export const WAVEFORM_DEMO_URL = `data:audio/wav;base64,${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))}`;
export const WAVEFORM_DEMO_PEAKS = Array.from({ length: 4096 }, (_, i) => {
  const start = Math.floor((i * samples.length) / 4096);
  const end = Math.floor(((i + 1) * samples.length) / 4096);
  return Math.round(
    (Math.max(...samples.slice(start, end).map(Math.abs)) / 32767) * 255,
  );
});
