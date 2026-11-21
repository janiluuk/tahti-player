import { describe, expect, it } from 'vitest';

import { encodeWavPcm16 } from './wav';

function readString(view: DataView, offset: number, length: number): string {
  let s = '';
  for (let i = 0; i < length; i++) {
    s += String.fromCharCode(view.getUint8(offset + i));
  }
  return s;
}

describe('encodeWavPcm16', () => {
  it('writes a valid RIFF/WAVE header with the right sizes and format fields', () => {
    const left = Float64Array.from([0, 0.5, -0.5, 1, -1]);
    const right = Float64Array.from([0, -0.5, 0.5, -1, 1]);
    const sampleRate = 48000;
    const buffer = encodeWavPcm16({ left, right }, sampleRate);
    const view = new DataView(buffer);

    expect(readString(view, 0, 4)).toBe('RIFF');
    expect(readString(view, 8, 4)).toBe('WAVE');
    expect(readString(view, 12, 4)).toBe('fmt ');
    expect(view.getUint32(16, true)).toBe(16); // fmt chunk size
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(2); // channels
    expect(view.getUint32(24, true)).toBe(sampleRate);
    expect(view.getUint16(32, true)).toBe(4); // block align (2 ch * 2 bytes)
    expect(view.getUint16(34, true)).toBe(16); // bits per sample
    expect(readString(view, 36, 4)).toBe('data');

    const dataSize = left.length * 4;
    expect(view.getUint32(40, true)).toBe(dataSize);
    expect(view.getUint32(4, true)).toBe(36 + dataSize);
    expect(buffer.byteLength).toBe(44 + dataSize);
  });

  it('round-trips sample values through 16-bit quantization', () => {
    const left = Float64Array.from([0, 1, -1, 0.5, -0.5]);
    const right = Float64Array.from([0, -1, 1, -0.5, 0.5]);
    const buffer = encodeWavPcm16({ left, right }, 44100);
    const view = new DataView(buffer);

    for (let i = 0; i < left.length; i++) {
      const l = view.getInt16(44 + i * 4, true) / 0x7fff;
      const r = view.getInt16(44 + i * 4 + 2, true) / 0x7fff;
      expect(l).toBeCloseTo(left[i], 3);
      expect(r).toBeCloseTo(right[i], 3);
    }
  });

  it('clamps out-of-range samples instead of wrapping', () => {
    const left = Float64Array.from([5, -5]);
    const right = Float64Array.from([5, -5]);
    const buffer = encodeWavPcm16({ left, right }, 44100);
    const view = new DataView(buffer);
    expect(view.getInt16(44, true)).toBe(0x7fff);
    expect(view.getInt16(46, true)).toBe(0x7fff);
    expect(view.getInt16(48, true)).toBe(-0x8000);
    expect(view.getInt16(50, true)).toBe(-0x8000);
  });
});
