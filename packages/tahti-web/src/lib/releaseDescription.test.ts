// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { releaseDescriptionLines } from './releaseDescription';

describe('releaseDescriptionLines', () => {
  it('returns an empty list for blank text', () => {
    expect(releaseDescriptionLines('  ')).toEqual([]);
  });

  it('keeps a plain paragraph as one line', () => {
    expect(releaseDescriptionLines('Liner notes for the album.')).toEqual([
      'Liner notes for the album.',
    ]);
  });

  it('splits on newlines', () => {
    expect(releaseDescriptionLines('First note\n\nSecond note')).toEqual([
      'First note',
      'Second note',
    ]);
  });

  it('splits a pasted numbered tracklist on one line', () => {
    expect(
      releaseDescriptionLines(
        '01 - Mysteeri 02 - Zoomerdoom 03 - Introvert Insanity',
      ),
    ).toEqual(['01 - Mysteeri', '02 - Zoomerdoom', '03 - Introvert Insanity']);
  });
});
