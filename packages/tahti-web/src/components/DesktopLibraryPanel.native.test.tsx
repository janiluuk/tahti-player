import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type {
  NativeLibraryImportProgress,
  NativeLibraryRoot,
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { usePlayerStore } from '../stores/playerStore';
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
  addedAt: '2026-09-18 12:00:00',
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
  addedAt: '2026-09-18 12:00:00',
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
    removeMany: vi.fn().mockResolvedValue(0),
    matchingIds: vi.fn().mockResolvedValue([]),
    prepareBatch: vi.fn().mockResolvedValue({ items: [], unavailable: 0 }),
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

beforeAll(() => {
  // jsdom has no layout; give the table's virtualizer a viewport.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: 600,
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 800,
  });
});

afterEach(() => {
  cleanup();
  usePlayerStore.getState().clearQueue();
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

    expect(await screen.findByText('Missing')).toBeTruthy();
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
    expect(screen.getByText('Dub Techno')).toBeTruthy();
    expect(screen.getByText('2001')).toBeTruthy();
    expect(screen.getByText('20 KB')).toBeTruthy();
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
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith('harb', 0, null, null),
    );
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
      expect(list).toHaveBeenCalledWith(
        '',
        0,
        { kind: 'artists', value: 'Vladislav Delay', secondary: null },
        null,
      ),
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
      expect(list).toHaveBeenCalledWith(
        '',
        0,
        { kind: 'albums', value: 'Anima', secondary: 'Vladislav Delay' },
        null,
      ),
    );
  });

  describe('selection across pages', () => {
    const tracks = ['a', 'b', 'c'].map((id) => ({
      ...availableTrack,
      id,
      title: `Song ${id}`,
    }));
    const setup = (overrides: Partial<TahtiNativeLibrary> = {}) => {
      globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
      const library = createNativeLibrary({
        // Later pages (requested while scrolling) stay pending, so the
        // table keeps reporting more rows than it has loaded.
        list: vi.fn((_search: string, offset: number) =>
          offset === 0
            ? Promise.resolve({ tracks, total: 1234 })
            : new Promise<never>(() => undefined),
        ),
        ...overrides,
      });
      globalThis.__TAHTI_NATIVE_LIBRARY__ = library;
      return library;
    };
    const everyId = Array.from({ length: 1234 }, (_, i) => `id-${i}`);

    it('selects every matching track, not just the loaded page', async () => {
      const matchingIds = vi.fn().mockResolvedValue(everyId);
      setup({ matchingIds });
      render(<DesktopLibraryPanel />);

      fireEvent.click(await screen.findByLabelText('Select all loaded tracks'));
      expect(screen.getByText(/3 selected/)).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Select all 1,234' }));

      expect(await screen.findByText(/All 1,234 selected/)).toBeTruthy();
      expect(matchingIds).toHaveBeenCalledWith('', null, null);
    });

    it('queues the selection in the order the table shows, not click order', async () => {
      const matchingIds = vi.fn().mockResolvedValue(['c', 'x', 'a', 'b']);
      const prepareBatch = vi.fn(async (ids: string[]) => ({
        unavailable: 0,
        items: ids.map((id) => ({
          track: { ...availableTrack, id, title: `Song ${id}` },
          streamUrl: `asset://${id}`,
        })),
      }));
      setup({ matchingIds, prepareBatch });
      render(<DesktopLibraryPanel />);

      fireEvent.click(await screen.findByLabelText('Select Song a'));
      fireEvent.click(screen.getByLabelText('Select Song c'));
      fireEvent.click(screen.getByRole('button', { name: 'Add to queue' }));

      await waitFor(() => expect(prepareBatch).toHaveBeenCalled());
      expect(prepareBatch).toHaveBeenCalledWith(['c', 'a']);
      await waitFor(() =>
        expect(
          usePlayerStore.getState().queue.map((q) => q.track.title),
        ).toEqual(['Song c', 'Song a']),
      );
    });

    it('plays the selection starting from its first track', async () => {
      const prepareBatch = vi.fn(async (ids: string[]) => ({
        unavailable: 0,
        items: ids.map((id) => ({
          track: { ...availableTrack, id, title: `Song ${id}` },
          streamUrl: `asset://${id}`,
        })),
      }));
      setup({
        matchingIds: vi.fn().mockResolvedValue(['a', 'b', 'c']),
        prepareBatch,
      });
      render(<DesktopLibraryPanel />);

      fireEvent.click(await screen.findByLabelText('Select all loaded tracks'));
      fireEvent.click(screen.getByRole('button', { name: 'Play' }));

      await waitFor(() =>
        expect(
          usePlayerStore.getState().queue.map((q) => q.track.title),
        ).toEqual(['Song a', 'Song b', 'Song c']),
      );
    });

    it('removes the whole selection in one call, after confirming', async () => {
      const removeMany = vi.fn().mockResolvedValue(1234);
      setup({ matchingIds: vi.fn().mockResolvedValue(everyId), removeMany });
      render(<DesktopLibraryPanel />);

      fireEvent.click(await screen.findByLabelText('Select all loaded tracks'));
      fireEvent.click(screen.getByRole('button', { name: 'Select all 1,234' }));
      await screen.findByText(/All 1,234 selected/);
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
      expect(removeMany).not.toHaveBeenCalled();
      const dialog = await screen.findByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));

      await waitFor(() => expect(removeMany).toHaveBeenCalledOnce());
      expect(removeMany.mock.calls[0]?.[0]).toHaveLength(1234);
    });

    it('drops the selection when the search changes', async () => {
      setup();
      render(<DesktopLibraryPanel />);

      fireEvent.click(await screen.findByLabelText('Select Song a'));
      expect(screen.getByText(/1 selected/)).toBeTruthy();
      fireEvent.change(screen.getByLabelText('Search desktop library'), {
        target: { value: 'harbour' },
      });
      await waitFor(() => expect(screen.queryByText(/1 selected/)).toBeNull());
    });
  });

  it('stops asking for more rows when a later page comes back empty', async () => {
    globalThis.__TAHTI_NATIVE_CAPABILITIES__ = { localLibrary: true };
    const list = vi.fn((_search: string, offset: number) =>
      Promise.resolve({
        tracks: offset === 0 ? [availableTrack] : [],
        total: 500,
      }),
    );
    globalThis.__TAHTI_NATIVE_LIBRARY__ = createNativeLibrary({ list });

    render(<DesktopLibraryPanel />);
    expect(await screen.findByText('Available track')).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(list.mock.calls.filter(([, offset]) => offset > 0).length).toBe(1);
  });
});
