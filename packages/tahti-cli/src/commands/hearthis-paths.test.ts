import { describe, expect, it } from 'vitest';

import {
  albumFolderName,
  cleanAlbumTrackTitle,
  discographyRelativePath,
  layoutRelativePath,
  pickAudioExtension,
  resolveAlbumYear,
  resolveSetOwner,
  sanitizePathSegment,
  splitAlbumSetTitle,
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

describe('album and set layouts', () => {
  it('splits a Set title into artist, album and year', () => {
    expect(
      splitAlbumSetTitle('Yaniho - Trancephobia LP - Old school trance', 'X'),
    ).toEqual({ artist: 'Yaniho', album: 'Trancephobia LP', year: null });
    expect(splitAlbumSetTitle('Yani & Ho - Mute8 (2026)', 'X')).toEqual({
      artist: 'Yani & Ho',
      album: 'Mute8',
      year: 2026,
    });
    expect(splitAlbumSetTitle('Chilled sets', 'Yaniho')).toEqual({
      artist: 'Yaniho',
      album: 'Chilled sets',
      year: null,
    });
  });

  it('drops the album and track number from track titles', () => {
    const album = { artist: 'Yaniho', album: 'Revitalize LP' };
    expect(
      cleanAlbumTrackTitle('Yaniho - Revitalize LP - 05 - Lights out', album),
    ).toBe('Lights out');
    expect(
      cleanAlbumTrackTitle(
        'Yaniho, Acraze  - Revitalize LP - 02 - Do It To It (demo #1)',
        album,
      ),
    ).toBe('Yaniho, Acraze - Do It To It (demo #1)');
    expect(
      cleanAlbumTrackTitle('Mute8 LP - 02 - Ditpik', {
        artist: 'Yani & Ho',
        album: 'Mute8',
      }),
    ).toBe('Ditpik');
    expect(
      cleanAlbumTrackTitle('Sisufuzz LP - 11- Dive (2026 rework)', album),
    ).toBe('Dive (2026 rework)');
    expect(cleanAlbumTrackTitle('XPRMNT LP - 08.5 - Gray matter', album)).toBe(
      'Gray matter',
    );
  });

  it('builds album and set paths', () => {
    const base = {
      artist: 'Yaniho',
      albumTitle: 'unused',
      year: 2023,
      position: 3,
      extension: 'wav',
    };
    expect(
      layoutRelativePath('album', {
        ...base,
        setTitle: 'Yaniho - Revitalize LP',
        trackTitle: 'Yaniho - Revitalize LP - 05 - Lights out',
      }),
    ).toBe('Yaniho - Revitalize LP (2023)/03 - Lights out.wav');
    expect(
      layoutRelativePath('set', {
        ...base,
        setTitle: 'Archive 2001-2009',
        trackTitle: 'Liveset @ Mermaid April 2007',
      }),
    ).toBe('Archive 2001-2009/Liveset @ Mermaid April 2007.wav');
  });

  it('takes the Set owner from the set, else the most common uploader', () => {
    expect(resolveSetOwner({ userPermalink: 'yaniho' }, [])).toBe('yaniho');
    expect(
      resolveSetOwner(null, [
        { userPermalink: 's-live' },
        { userPermalink: 'yaniho' },
        { userPermalink: 'yaniho' },
      ]),
    ).toBe('yaniho');
  });
});
