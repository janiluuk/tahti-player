import { describe, expect, it } from 'vitest';

import { describeImportFailures } from './DesktopLibraryPanel';

describe('describeImportFailures', () => {
  it('lists each failing file by its base name with its error', () => {
    expect(
      describeImportFailures([
        { path: '/music/Album/track-1.flac', error: 'Cannot read audio' },
        { path: 'C:\\music\\track-2.wav', error: 'No audio track' },
      ]),
    ).toBe(
      ['track-1.flac: Cannot read audio', 'track-2.wav: No audio track'].join(
        '\n',
      ),
    );
  });

  it('caps the listed failures and summarizes the remainder', () => {
    const errors = Array.from({ length: 8 }, (_, index) => ({
      path: `/music/track-${index}.flac`,
      error: 'Cannot read audio',
    }));
    const description = describeImportFailures(errors);
    const lines = description.split('\n');
    expect(lines).toHaveLength(6);
    expect(lines[5]).toBe('…and 3 more.');
  });

  it('returns an empty string for no failures', () => {
    expect(describeImportFailures([])).toBe('');
  });
});
