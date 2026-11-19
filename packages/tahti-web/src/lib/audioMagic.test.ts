import { describe, expect, it } from 'vitest';

import { sniffAudioBytes, sniffAudioFile } from './audioMagic';

const bytes = (...parts: (string | number[])[]) =>
  new Uint8Array(
    parts.flatMap((part) =>
      typeof part === 'string' ? [...part].map((c) => c.charCodeAt(0)) : part,
    ),
  );

describe('sniffAudioBytes', () => {
  it.each([
    ['MP3 with ID3', bytes('ID3', [4, 0, 0])],
    ['MP3 frame', bytes([0xff, 0xfb, 0x90, 0x64])],
    ['AAC ADTS', bytes([0xff, 0xf1, 0x50, 0x80])],
    ['WAV', bytes('RIFF', [0, 0, 0, 0], 'WAVEfmt ')],
    ['RF64 WAV', bytes('RF64', [0, 0, 0, 0], 'WAVE')],
    ['FLAC', bytes('fLaC', [0, 0, 0, 34])],
    ['Ogg', bytes('OggS', [0, 2])],
    ['AIFF', bytes('FORM', [0, 0, 0, 0], 'AIFF')],
    ['AIFC', bytes('FORM', [0, 0, 0, 0], 'AIFC')],
    ['M4A', bytes([0, 0, 0, 32], 'ftypM4A ')],
    ['WebM / Matroska', bytes([0x1a, 0x45, 0xdf, 0xa3])],
    ['WMA', bytes([0x30, 0x26, 0xb2, 0x75])],
    ['CAF', bytes('caff', [0, 0, 0, 1])],
    ['BW64', bytes('BW64', [0, 0, 0, 0], 'WAVE')],
    ['WavPack', bytes('wvpk', [0x20, 0x12])],
    ['DSDIFF', bytes('FRM8', [0, 0, 0, 0], 'DSD ')],
    ['AMR narrowband', bytes('#!AMR\n')],
  ])('%s is audio', (_, head) => {
    expect(sniffAudioBytes(head)).toBe('audio');
  });

  it.each([
    ['PDF', bytes('%PDF-1.7')],
    ['PNG', bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])],
    ['JPEG', bytes([0xff, 0xd8, 0xff, 0xe0])],
    ['GIF', bytes('GIF89a')],
    ['ZIP / docx', bytes('PK', [3, 4])],
    ['gzip', bytes([0x1f, 0x8b, 8])],
    ['Windows program', bytes('MZ', [0x90, 0])],
    ['HTML', bytes('  <!doctype html>')],
    ['SVG with BOM', bytes([0xef, 0xbb, 0xbf], '<svg')],
    ['WebP image', bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 ')],
    ['AVI video', bytes('RIFF', [0, 0, 0, 0], 'AVI LIST')],
    ['empty file', bytes()],
    ['SQLite database', bytes('SQLite format 3\0')],
    ['bplist', bytes('bplist00')],
    ['7z archive', bytes([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])],
    ['RTF document', bytes('{\\rtf1')],
  ])('%s is not audio', (_, head) => {
    expect(sniffAudioBytes(head)).toBe('not-audio');
  });

  it('leaves files it cannot place to the API', () => {
    expect(sniffAudioBytes(bytes('junk before the first frame'))).toBe(
      'unknown',
    );
    expect(sniffAudioBytes(bytes('RIFF'))).toBe('unknown');
  });
});

describe('sniffAudioFile', () => {
  it('reads only the head of the file', async () => {
    const pdf = new File(['%PDF-1.4', 'x'.repeat(1000)], 'song.mp3', {
      type: 'audio/mpeg',
    });
    expect(await sniffAudioFile(pdf)).toBe('not-audio');
    const wav = new File(['RIFF\0\0\0\0WAVEfmt '], 'take.wav');
    expect(await sniffAudioFile(wav)).toBe('audio');
  });
});
