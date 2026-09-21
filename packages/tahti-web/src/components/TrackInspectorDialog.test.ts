import { describe, expect, it } from 'vitest';

import type { NativeLibraryTrack } from '../lib/nativeLibrary';
import { inspectorRows } from './TrackInspectorDialog';

const track: NativeLibraryTrack = {
  id: 't',
  title: 'Huone',
  artist: 'Vladislav Delay',
  album: 'Anima',
  format: 'flac',
  duration: 245,
  sizeBytes: 30 * 1024 * 1024,
  available: true,
  unavailableSince: null,
  path: '/music/huone.flac',
  sampleRate: 96000,
  channels: 2,
  bitsPerSample: 24,
  albumArtist: '',
  trackNo: 3,
  discNo: null,
  year: 2001,
  genre: 'Dub Techno',
  comment: '',
  bitrateKbps: 1411,
  addedAt: '2026-09-18 12:00:00',
};
const value = (rows: ReturnType<typeof inspectorRows>, label: string) =>
  rows.find((row) => row.label === label)?.value;

describe('inspectorRows', () => {
  it('lists tags and file facts, showing a dash for unknown values', () => {
    const rows = inspectorRows(track);
    expect(value(rows, 'Album')).toBe('Anima');
    expect(value(rows, 'Album artist')).toBe('—');
    expect(value(rows, 'Disc')).toBe('—');
    expect(value(rows, 'Track')).toBe('3');
    expect(value(rows, 'Path')).toBe('/music/huone.flac');
    expect(value(rows, 'Sample rate')).toBe('96000 Hz');
    expect(value(rows, 'Bit depth')).toBe('24-bit');
    expect(value(rows, 'Duration')).toBe('4:05');
    expect(value(rows, 'Size')).toBe('30 MB');
    expect(value(rows, 'Status')).toBe('Available');
    expect(rows.filter((r) => r.section === 'Tags')).toHaveLength(9);
  });

  it('explains a missing file', () => {
    const rows = inspectorRows({
      ...track,
      available: false,
      unavailableSince: '2026-09-20T10:00:00Z',
    });
    expect(value(rows, 'Status')).toBe('Missing since 2026-09-20T10:00:00Z');
  });
});
