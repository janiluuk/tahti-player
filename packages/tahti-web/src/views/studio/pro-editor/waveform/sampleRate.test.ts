import { describe, expect, it } from 'vitest';

import { sniffSampleRate } from './sampleRate';

function bytes(
  length: number,
  write: (view: DataView, u8: Uint8Array) => void,
) {
  const buffer = new ArrayBuffer(length);
  write(new DataView(buffer), new Uint8Array(buffer));
  return buffer;
}

const putAscii = (u8: Uint8Array, at: number, text: string) => {
  for (let i = 0; i < text.length; i++) {
    u8[at + i] = text.charCodeAt(i);
  }
};

describe('sniffSampleRate', () => {
  it('reads a WAV fmt chunk', () => {
    const wav = bytes(64, (view, u8) => {
      putAscii(u8, 0, 'RIFF');
      putAscii(u8, 8, 'WAVE');
      putAscii(u8, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint32(24, 96000, true);
    });
    expect(sniffSampleRate(wav)).toBe(96000);
  });

  it('reads FLAC STREAMINFO', () => {
    const flac = bytes(64, (_view, u8) => {
      putAscii(u8, 0, 'fLaC');
      const rate = 44100;
      u8[18] = (rate >> 12) & 0xff;
      u8[19] = (rate >> 4) & 0xff;
      u8[20] = (rate & 0x0f) << 4;
    });
    expect(sniffSampleRate(flac)).toBe(44100);
  });

  it('reads an MPEG-1 frame header after an ID3 tag', () => {
    const mp3 = bytes(64, (_view, u8) => {
      putAscii(u8, 0, 'ID3');
      u8[9] = 10;
      u8[20] = 0xff;
      u8[21] = 0xfb;
      u8[22] = 0x94;
    });
    expect(sniffSampleRate(mp3)).toBe(48000);
  });

  it('knows Ogg Opus decodes at 48 kHz and reads Ogg Vorbis', () => {
    const opus = bytes(64, (_view, u8) => {
      putAscii(u8, 0, 'OggS');
      putAscii(u8, 28, 'OpusHead');
    });
    expect(sniffSampleRate(opus)).toBe(48000);
    const vorbis = bytes(64, (view, u8) => {
      putAscii(u8, 0, 'OggS');
      u8[28] = 1;
      putAscii(u8, 29, 'vorbis');
      view.setUint32(40, 22050, true);
    });
    expect(sniffSampleRate(vorbis)).toBe(22050);
  });

  it('returns null for unknown or truncated data', () => {
    expect(sniffSampleRate(new ArrayBuffer(4))).toBeNull();
    expect(sniffSampleRate(new ArrayBuffer(64))).toBeNull();
  });
});
