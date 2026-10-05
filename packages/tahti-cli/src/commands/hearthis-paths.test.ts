import { describe, expect, it } from 'vitest';

import {
  albumFolderName,
  discographyRelativePath,
  pickAudioExtension,
  resolveAlbumYear,
  sanitizePathSegment,
  trackFileStem,
} from './hearthis-paths.mjs';

describe('sanitizePathSegment', () => {
  it('strips path separators and trims', () => {
    expect(sanitizePathSegment('A / B: live?')).toBe('A B live');
    expect(sanitizePathSegment('')).toBe('Unknown');
  });
});

describe('albumFolderName / trackFileStem', () => {
  it('adds year when present', () => {
    expect(albumFolderName('Euphorizer LP', 2024)).toBe('Euphorizer LP (2024)');
    expect(albumFolderName('Euphorizer LP', null)).toBe('Euphorizer LP');
  });

  it('zero-pads track numbers', () => {
    expect(trackFileStem(1, 'Hysterizer')).toBe('01 - Hysterizer');
    expect(trackFileStem(12, 'Dive')).toBe('12 - Dive');
  });
});

describe('pickAudioExtension', () => {
  it('prefers lossless filename over compressed content-type', () => {
    expect(pickAudioExtension('Track.wav', 'audio/mpeg')).toBe('wav');
    expect(pickAudioExtension('Track.flac', 'audio/mp3')).toBe('flac');
  });

  it('uses content-type when filename has no audio extension', () => {
    expect(pickAudioExtension('Track', 'audio/flac')).toBe('flac');
    expect(pickAudioExtension(null, 'audio/mpeg')).toBe('mp3');
  });
});

describe('discographyRelativePath', () => {
  it('builds Artist/Album (year)/NN - Track.ext', () => {
    expect(
      discographyRelativePath({
        artist: 'Yaniho',
        albumTitle: 'Euphorizer LP',
        year: 2024,
        position: 17,
        trackTitle: 'Hysterizer',
        extension: 'wav',
      }),
    ).toBe('Yaniho/Euphorizer LP (2024)/17 - Hysterizer.wav');
  });
});

describe('resolveAlbumYear', () => {
  it('uses set.year, else earliest track releaseDate', () => {
    expect(resolveAlbumYear({ year: 2020 }, [])).toBe(2020);
    expect(
      resolveAlbumYear(null, [
        { releaseDate: '2024-01-01' },
        { releaseDate: '2022-06-01' },
      ]),
    ).toBe(2022);
  });
});
