import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  NativeLibraryImportProgress,
  NativeLibraryRoot,
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
  albumArtist: '',
  trackNo: null,
  discNo: null,
  year: null,
  genre: '',
  comment: '',
  bitrateKbps: null,
};

const availableTrack: NativeLibraryTrack = {
  id: 'available-track',
  title: 'Available track',
  artist: 'Local artist',
  album: 'Local album',
  format: 'flac',
  duration: 90,
  sizeBytes: 20_000,
  available: true,
  unavailableSince: null,
  albumArtist: '',
  trackNo: null,
  discNo: null,
  year: 2001,
  genre: 'Dub Techno',
  comment: '',
  bitrateKbps: 1411,
};

const musicRoot: NativeLibraryRoot = {
  id: 'root-1',
  path: '/music/Archive',
  createdAt: '2026-09-21T10:00:00Z',
  lastScannedAt: null,
  trackCount: 12,
  missingCount: 0,
  available: true,
};

function createNativeLibrary(
  overrides: Partial<TahtiNativeLibrary> = {},
): TahtiNativeLibrary {
  return {
    list: vi.fn().mockResolvedValue({ tracks: [], total: 0 }),
    import: vi.fn().mockResolvedValue({
      imported: 0,
      skipped: 0,
      errors: [],
      cancelled: false,
    }),
    importFolder: vi.fn().mockResolvedValue({
      imported: 0,
      skipped: 0,
      errors: [],
      cancelled: false,
    }),
    importPaths: vi.fn().mockResolvedValue({
      imported: 0,
      skipped: 0,
      errors: [],
      cancelled: false,
    }),
    cancelImport: vi.fn(),
    resolve: vi.fn(),
    remove: vi.fn(),
    reveal: vi.fn(),
    facets: vi.fn().mockResolvedValue([]),
    totals: vi.fn().mockResolvedValue({
      trackCount: 0,
      durationSec: 0,
      sizeBytes: 0,
    }),
    listUnavailable: vi.fn().mockResolvedValue([]),
    rescan: vi.fn().mockResolvedValue([]),
    relink: vi.fn(),
    listRoots: vi.fn().mockResolvedValue([]),
    addRoot: vi.fn().mockResolvedValue(null),
    removeRoot: vi.fn().mockResolvedValue(undefined),
    rescanRoots: vi.fn().mockResolvedValue({
      imported: 0,
      skipped: 0,
      missing: 0,
      recovered: 0,
      errors: [],
      cancelled: false,
    }),
    relinkRoot: vi.fn().mockResolvedValue(null),
    onImportProgress: vi.fn().mockReturnValue(() => {}),
    onFilesDropped: vi.fn().mockReturnValue(() => {}),
    ...overrides,
  };
}

afterEach(() => {
  globalThis.__TAHTI_NATIVE_LIBRARY__ = undefined;
  globalThis.__TAHTI_NATIVE_CAPABILITIES__ = undefined;
});

describe('DesktopLibraryPanel native missing files', () => {
  it('re-scans missing files and opens relink for an unavailable track', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    const rescan = vi.fn().mockResolvedValue([missingTrack]);
    const relink = vi.fn().mockResolvedValue({
      ...missingTrack,
      available: true,
      unavailableSince: null,
    });
    const nativeLibrary = createNativeLibrary({
      list: vi.fn().mockResolvedValue({ tracks: [missingTrack], total: 1 }),
      listUnavailable: vi.fn().mockResolvedValue([missingTrack]),
      rescan,
      relink,
    });
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

describe('DesktopLibraryPanel native import', () => {
  it('imports files dropped onto the app window', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    let dropListener: ((paths: string[]) => void) | undefined;
    const importPaths = vi.fn().mockResolvedValue({
      imported: 1,
      skipped: 0,
      errors: [],
      cancelled: false,
    });
    const nativeLibrary = createNativeLibrary({
      importPaths,
      onFilesDropped: vi.fn((listener) => {
        dropListener = listener;
        return () => {};
      }),
    });
    globalThis.__TAHTI_NATIVE_LIBRARY__ = nativeLibrary;

    render(<DesktopLibraryPanel />);
    await waitFor(() => expect(nativeLibrary.list).toHaveBeenCalled());

    expect(dropListener).toBeTruthy();
    dropListener?.(['/music/one.flac', '/music/folder']);

    await waitFor(() =>
      expect(importPaths).toHaveBeenCalledWith([
        '/music/one.flac',
        '/music/folder',
      ]),
    );
  });

  it('shows live progress and lets the user cancel an in-flight import', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    let progressListener:
      | ((progress: NativeLibraryImportProgress) => void)
      | undefined;
    const cancelImport = vi.fn();
    const nativeLibrary = createNativeLibrary({
      cancelImport,
      onImportProgress: vi.fn((listener) => {
        progressListener = listener;
        return () => {};
      }),
    });
    globalThis.__TAHTI_NATIVE_LIBRARY__ = nativeLibrary;

    render(<DesktopLibraryPanel />);
    await waitFor(() => expect(nativeLibrary.list).toHaveBeenCalled());

    expect(progressListener).toBeTruthy();
    act(() => {
      progressListener?.({
        done: 2,
        total: 5,
        imported: 1,
        failed: 1,
        skipped: 0,
        currentPath: '/music/two.flac',
      });
    });

    expect(
      await screen.findByText('Importing 2 of 5 — 1 imported, 1 failed'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(cancelImport).toHaveBeenCalledOnce();
  });

  it('reveals an available track in the OS file manager', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    const reveal = vi.fn().mockResolvedValue(undefined);
    const nativeLibrary = createNativeLibrary({
      list: vi.fn().mockResolvedValue({ tracks: [availableTrack], total: 1 }),
      reveal,
    });
    globalThis.__TAHTI_NATIVE_LIBRARY__ = nativeLibrary;

    render(<DesktopLibraryPanel />);

    expect(await screen.findByText('Available track')).toBeTruthy();
    expect(
      screen.getByText(/2001 · Dub Techno · FLAC · 20 KB · 1411 kbps/),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Reveal Available track in folder',
      }),
    );
    await waitFor(() => expect(reveal).toHaveBeenCalledWith('available-track'));
  });

  it('lists watched folders and rescans them', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    const rescanRoots = vi.fn().mockResolvedValue({
      imported: 3,
      skipped: 0,
      missing: 0,
      recovered: 0,
      errors: [],
      cancelled: false,
    });
    const nativeLibrary = createNativeLibrary({
      listRoots: vi.fn().mockResolvedValue([musicRoot]),
      rescanRoots,
    });
    globalThis.__TAHTI_NATIVE_LIBRARY__ = nativeLibrary;

    render(<DesktopLibraryPanel />);

    expect(await screen.findByText('Archive')).toBeTruthy();
    expect(screen.getByText('12 tracks')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Rescan' }));
    await waitFor(() => expect(rescanRoots).toHaveBeenCalledOnce());
  });

  it('confirms before a watched folder stops being tracked', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    const removeRoot = vi.fn().mockResolvedValue(undefined);
    const nativeLibrary = createNativeLibrary({
      listRoots: vi.fn().mockResolvedValue([musicRoot]),
      removeRoot,
    });
    globalThis.__TAHTI_NATIVE_LIBRARY__ = nativeLibrary;

    render(<DesktopLibraryPanel />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Stop watching Archive' }),
    );
    expect(removeRoot).not.toHaveBeenCalled();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Stop watching' }),
    );
    await waitFor(() => expect(removeRoot).toHaveBeenCalledWith('root-1'));
  });

  it('debounces search so typing does not query on every keystroke', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    const list = vi.fn().mockResolvedValue({ tracks: [], total: 0 });
    globalThis.__TAHTI_NATIVE_LIBRARY__ = createNativeLibrary({ list });

    render(<DesktopLibraryPanel />);
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));

    const input = screen.getByLabelText('Search desktop library');
    for (const value of ['h', 'ha', 'har', 'harb']) {
      fireEvent.change(input, { target: { value } });
    }
    await waitFor(() => expect(list).toHaveBeenCalledWith('harb', 0, null));
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('shows on-device totals separately from cloud storage', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    globalThis.__TAHTI_NATIVE_LIBRARY__ = createNativeLibrary({
      totals: vi.fn().mockResolvedValue({
        trackCount: 1234,
        durationSec: 3 * 3600 + 20 * 60,
        sizeBytes: 3.5 * 1024 * 1024 * 1024,
      }),
    });

    render(<DesktopLibraryPanel />);

    expect((await screen.findByTestId('library-totals')).textContent).toBe(
      '1,234 tracks · 3 h 20 m · 3.5 GB on this device',
    );
  });

  it('browses by artist, filters the track list to a group and clears it', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    const facets = vi.fn().mockResolvedValue([
      {
        name: 'Vladislav Delay',
        secondary: '',
        year: null,
        trackCount: 2,
        durationSec: 600,
        sizeBytes: 40_000_000,
      },
      {
        name: '',
        secondary: '',
        year: null,
        trackCount: 1,
        durationSec: 60,
        sizeBytes: 1_000_000,
      },
    ]);
    const list = vi
      .fn()
      .mockResolvedValue({ tracks: [availableTrack], total: 1 });
    globalThis.__TAHTI_NATIVE_LIBRARY__ = createNativeLibrary({ facets, list });

    render(<DesktopLibraryPanel />);
    await waitFor(() => expect(list).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('tab', { name: 'Artists' }));
    expect(await screen.findByText('Vladislav Delay')).toBeTruthy();
    expect(screen.getByText('Unknown artist')).toBeTruthy();
    expect(screen.getByText('2 tracks · 10 min · 38 MB')).toBeTruthy();
    expect(facets).toHaveBeenCalledWith('artists');

    fireEvent.click(screen.getByText('Vladislav Delay'));
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith('', 0, {
        kind: 'artists',
        value: 'Vladislav Delay',
        secondary: null,
      }),
    );
    expect(await screen.findByText('Available track')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Clear Artist filter' }),
    );
    expect(await screen.findByText('Unknown artist')).toBeTruthy();
  });

  it('filters albums by name and album artist together', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    const list = vi.fn().mockResolvedValue({ tracks: [], total: 0 });
    globalThis.__TAHTI_NATIVE_LIBRARY__ = createNativeLibrary({
      list,
      facets: vi.fn().mockResolvedValue([
        {
          name: 'Anima',
          secondary: 'Vladislav Delay',
          year: 2001,
          trackCount: 9,
          durationSec: 3000,
          sizeBytes: 300_000_000,
        },
      ]),
    });

    render(<DesktopLibraryPanel />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Albums' }));
    expect(
      await screen.findByText(/Vladislav Delay · 2001 · 9 tracks/),
    ).toBeTruthy();
    fireEvent.click(screen.getByText('Anima'));
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith('', 0, {
        kind: 'albums',
        value: 'Anima',
        secondary: 'Vladislav Delay',
      }),
    );
  });
});
