import { describe, expect, it } from 'vitest';

import {
  formatLibrarySize,
  formatTotalDuration,
  pluralTracks,
} from './libraryFormat';

describe('libraryFormat', () => {
  it('formats sizes across KB, MB and GB', () => {
    expect(formatLibrarySize(10)).toBe('1 KB');
    expect(formatLibrarySize(20_000)).toBe('20 KB');
    expect(formatLibrarySize(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatLibrarySize(420 * 1024 * 1024)).toBe('420 MB');
    expect(formatLibrarySize(3.5 * 1024 * 1024 * 1024)).toBe('3.5 GB');
  });

  it('formats coarse totals', () => {
    expect(formatTotalDuration(10)).toBe('<1 min');
    expect(formatTotalDuration(45 * 60)).toBe('45 min');
    expect(formatTotalDuration(3 * 3600)).toBe('3 h');
    expect(formatTotalDuration(3 * 3600 + 20 * 60)).toBe('3 h 20 m');
  });

  it('pluralises track counts', () => {
    expect(pluralTracks(1)).toBe('1 track');
    expect(pluralTracks(1234)).toBe('1,234 tracks');
  });
});
