import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { DesktopLibraryPanel } from './DesktopLibraryPanel';

const missingTrack: NativeLibraryTrack = {
  id: 'missing-track',
  title: 'Missing track',
  artist: 'Local artist',
  album: 'Local album',
  format: 'flac',
  duration: 120,
  sizeBytes: 10_000,
  available: false,
  unavailableSince: '2026-09-18T12:00:00Z',
};

afterEach(() => {
  globalThis.__TAHTI_NATIVE_LIBRARY__ = undefined;
});

describe('DesktopLibraryPanel native missing files', () => {
  it('re-scans missing files and opens relink for an unavailable track', async () => {
    const rescan = vi.fn().mockResolvedValue([missingTrack]);
    const relink = vi.fn().mockResolvedValue({
      ...missingTrack,
      available: true,
      unavailableSince: null,
    });
    const nativeLibrary: TahtiNativeLibrary = {
      list: vi.fn().mockResolvedValue({ tracks: [missingTrack], total: 1 }),
      import: vi.fn().mockResolvedValue({ imported: 0, errors: [] }),
      resolve: vi.fn(),
      remove: vi.fn(),
      listUnavailable: vi.fn().mockResolvedValue([missingTrack]),
      rescan,
      relink,
    };
    globalThis.__TAHTI_NATIVE_LIBRARY__ = nativeLibrary;

    render(<DesktopLibraryPanel />);

    expect(await screen.findByText('Original file is missing')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Check missing files (1)' }),
    );
    await waitFor(() => expect(rescan).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('button', { name: 'Locate' }));
    await waitFor(() => expect(relink).toHaveBeenCalledWith('missing-track'));
  });
});
