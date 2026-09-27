import { describe, expect, it } from 'vitest';

import type { NativeLibraryTrack } from '../lib/nativeLibrary';
import { NATIVE_TRACK_COLUMNS, toNativeSort } from './nativeTrackColumns';

const skips = NATIVE_TRACK_COLUMNS.find((column) => column.id === 'skips');

describe('Skips column', () => {
  it('is sortable, right-aligned and hidden until chosen', () => {
    expect(skips).toMatchObject({
      header: 'Skips',
      sortable: true,
      align: 'right',
      hiddenByDefault: true,
    });
  });

  it('shows the count, or a dash when never skipped', () => {
    const render = (skipCount: number) =>
      skips?.render({ skipCount } as NativeLibraryTrack);
    expect(render(3)).toBe(3);
    expect(render(0)).toBe('—');
  });

  it('sorts natively by skip count', () => {
    expect(toNativeSort({ columnId: 'skips', descending: true })).toEqual({
      column: 'skips',
      descending: true,
    });
  });
});
