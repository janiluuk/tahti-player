import type { StereoSignal } from './levels';

/** Encodes a stereo signal as a standard 16-bit PCM WAV file
 * (`ArrayBuffer`), synchronous and dependency-free — the mastered result
 * has no reason to round-trip through anything server-side, so this is a
 * small hand-rolled encoder rather than a new dependency. */
export function encodeWavPcm16(
  stereo: StereoSignal,
  sampleRate: number,
): ArrayBuffer {
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const numFrames = stereo.left.length;
  const dataSize = numFrames * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  let offset = 0;

  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset++, s.charCodeAt(i));
    }
  };
  const writeUint32 = (v: number) => {
    view.setUint32(offset, v, true);
    offset += 4;
  };
  const writeUint16 = (v: number) => {
    view.setUint16(offset, v, true);
    offset += 2;
  };

  writeString('RIFF');
  writeUint32(36 + dataSize);
  writeString('WAVE');

  writeString('fmt ');
  writeUint32(16);
  writeUint16(1); // PCM
  writeUint16(numChannels);
  writeUint32(sampleRate);
  writeUint32(sampleRate * blockAlign); // byte rate
  writeUint16(blockAlign);
  writeUint16(16); // bits per sample

  writeString('data');
  writeUint32(dataSize);

  const toInt16 = (sample: number): number => {
    const clamped = Math.max(-1, Math.min(1, sample));
    return Math.round(clamped * (clamped < 0 ? 0x8000 : 0x7fff));
  };

  for (let i = 0; i < numFrames; i++) {
    view.setInt16(offset, toInt16(stereo.left[i]), true);
    offset += 2;
    view.setInt16(offset, toInt16(stereo.right[i]), true);
    offset += 2;
  }

  return buffer;
}
