import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  NativeItunesImport,
  NativeItunesImportProgress,
  NativeItunesImportResult,
  NativeItunesPreview,
} from '../../lib/nativeLibrary';
import { ItunesImportDialog, unresolvedAsText } from './ItunesImportDialog';

const XML = '/Users/me/Music/Library.xml';

const preview = (
  overrides: Partial<NativeItunesPreview> = {},
): NativeItunesPreview => ({
  musicFolder: '/Volumes/Old/iTunes Media',
  tracks: 10,
  tracksInCatalog: 2,
  tracksToImport: 3,
  tracksMissing: 4,
  tracksUnsupported: 1,
  tracksNotLocal: 0,
  duplicateTracks: 0,
  previouslyImported: 0,
  playlists: 2,
  playlistEntries: 12,
  playlistFolders: 1,
  playlistsAlreadyImported: 0,
  builtinPlaylistsSkipped: 5,
  unresolved: [
    {
      name: 'Gone',
      artist: 'A',
      path: '/Volumes/Old/iTunes Media/Music/A/01 Gone.flac',
      reason: 'missing',
    },
    {
      name: 'Protected',
      artist: 'B',
      path: '/Volumes/Old/iTunes Media/Music/B/Protected.m4p',
      reason: 'unsupported',
    },
  ],
  ...overrides,
});

const result = (
  overrides: Partial<NativeItunesImportResult> = {},
): NativeItunesImportResult => ({
  tracksLinked: 2,
  tracksImported: 7,
  tracksFailed: 1,
  tracksMissing: 0,
  tracksUnsupported: 1,
  tracksNotLocal: 0,
  duplicateTracks: 0,
  playsAdded: 40,
  skipsAdded: 3,
  ratingsApplied: 5,
  lovedTagged: 2,
  fieldsFilled: 11,
  fieldsKeptFromFile: 4,
  bpmApplied: 0,
  playlistsCreated: 2,
  playlistsRenamed: 0,
  playlistsAlreadyImported: 0,
  playlistEntries: 12,
  playlistEntriesUnavailable: 1,
  playlistEntriesSkipped: 0,
  errors: [{ path: '/Music/New/C/Broken.flac', error: 'Not a FLAC file' }],
  ...overrides,
});

function fakeImport(
  previews: NativeItunesPreview[],
  outcome: NativeItunesImportResult = result(),
) {
  const api: NativeItunesImport = {
    pick: vi.fn(async () => XML),
    preview: vi.fn(async () => previews.shift() ?? preview()),
    commit: vi.fn(async () => outcome),
  };
  return api;
}

function renderDialog(api: NativeItunesImport, pickFolder = vi.fn()) {
  const onImported = vi.fn();
  render(
    <ItunesImportDialog
      isOpen
      onClose={vi.fn()}
      itunesImport={api}
      pickFolder={pickFolder}
      onImported={onImported}
    />,
  );
  return { onImported, pickFolder };
}

async function openPreview(api: NativeItunesImport) {
  const rendered = renderDialog(api);
  fireEvent.click(screen.getByRole('button', { name: /Choose library file/ }));
  await screen.findByText(/5 of 10 tracks found/);
  return rendered;
}

describe('ItunesImportDialog', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('previews the chosen file with resolved, missing and unsupported counts', async () => {
    const api = fakeImport([preview()]);
    await openPreview(api);

    expect(api.preview).toHaveBeenCalledWith(XML, []);
    expect(screen.getByText(XML)).toBeTruthy();
    expect(
      screen.getByText('5 of 10 tracks found, 5 not resolved; 2 playlists.'),
    ).toBeTruthy();
    expect(screen.getByText('File not found').nextSibling?.textContent).toBe(
      '4',
    );
    expect(
      screen.getByText('/Volumes/Old/iTunes Media/Music/A/01 Gone.flac'),
    ).toBeTruthy();
    expect(
      screen.getByText('/Volumes/Old/iTunes Media/Music/B/Protected.m4p'),
    ).toBeTruthy();
  });

  it('stays on the file step when the pick is cancelled', async () => {
    const api = fakeImport([]);
    vi.mocked(api.pick).mockResolvedValueOnce(null);
    renderDialog(api);
    fireEvent.click(
      screen.getByRole('button', { name: /Choose library file/ }),
    );
    await waitFor(() => expect(api.pick).toHaveBeenCalled());
    expect(api.preview).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: /Choose library file/ }),
    ).toBeTruthy();
  });

  it('shows a preview error and lets the user pick again', async () => {
    const api = fakeImport([]);
    vi.mocked(api.preview).mockRejectedValueOnce(
      new Error('Not an iTunes library file'),
    );
    renderDialog(api);
    fireEvent.click(
      screen.getByRole('button', { name: /Choose library file/ }),
    );
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Not an iTunes library file',
    );
    expect(
      screen.getByRole('button', { name: /Choose library file/ }),
    ).toBeTruthy();
  });

  it('adds a folder remap from the music folder, re-previews and imports with it', async () => {
    const api = fakeImport([
      preview(),
      preview({ tracksToImport: 7, tracksMissing: 0 }),
    ]);
    const pickFolder = vi.fn(async () => '/Music/New');
    api.pick = vi.fn(async () => XML);
    const onImported = vi.fn();
    render(
      <ItunesImportDialog
        isOpen
        onClose={vi.fn()}
        itunesImport={api}
        pickFolder={pickFolder}
        onImported={onImported}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Choose library file/ }),
    );
    await screen.findByText(/5 of 10 tracks found/);

    fireEvent.click(screen.getByRole('button', { name: 'Add folder remap' }));
    const oldFolder = screen.getByLabelText('Old folder') as HTMLInputElement;
    expect(oldFolder.value).toBe('/Volumes/Old/iTunes Media');
    fireEvent.click(
      screen.getByRole('button', { name: 'Choose new folder 1' }),
    );
    await waitFor(() =>
      expect(
        (screen.getByLabelText('New folder') as HTMLInputElement).value,
      ).toBe('/Music/New'),
    );

    expect(screen.getByText(/Preview again to apply/)).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Import' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Preview again' }));
    await screen.findByText(/9 of 10 tracks found/);
    expect(api.preview).toHaveBeenLastCalledWith(XML, [
      { from: '/Volumes/Old/iTunes Media', to: '/Music/New' },
    ]);
    expect(screen.queryByText(/Preview again to apply/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    await screen.findByText(/9 tracks linked or imported/);
    expect(api.commit).toHaveBeenCalledWith(XML, [
      { from: '/Volumes/Old/iTunes Media', to: '/Music/New' },
    ]);
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it('ignores half-filled remaps and removes a remap row', async () => {
    const api = fakeImport([preview()]);
    await openPreview(api);
    fireEvent.click(screen.getByRole('button', { name: 'Add folder remap' }));
    expect(screen.queryByText(/Preview again to apply/)).toBeNull();
    fireEvent.change(screen.getByLabelText('New folder'), {
      target: { value: '/Music/New' },
    });
    expect(screen.getByText(/Preview again to apply/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove remap 1' }));
    expect(screen.queryByLabelText('Old folder')).toBeNull();
    expect(screen.queryByText(/Preview again to apply/)).toBeNull();
  });

  it('summarises the import and lists the tracks it could not resolve', async () => {
    const api = fakeImport([preview()], result());
    const { onImported } = await openPreview(api);
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    const status = await screen.findByText(
      '9 tracks linked or imported, 2 playlists created; 2 not resolved.',
    );
    expect(status).toBeTruthy();
    expect(onImported).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Plays added').nextSibling?.textContent).toBe('40');
    const failure = screen.getByText('Not a FLAC file').closest('li')!;
    expect(within(failure).getByText('/Music/New/C/Broken.flac')).toBeTruthy();
    expect(
      screen.getByText('/Volumes/Old/iTunes Media/Music/B/Protected.m4p'),
    ).toBeTruthy();
    expect(screen.queryByText(/01 Gone\.flac/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();
  });

  it('keeps the preview and shows the error when the import fails', async () => {
    const api = fakeImport([preview()]);
    vi.mocked(api.commit).mockRejectedValueOnce(new Error('Disk full'));
    const { onImported } = await openPreview(api);
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Disk full');
    expect(screen.getByText(/5 of 10 tracks found/)).toBeTruthy();
    expect(onImported).not.toHaveBeenCalled();
  });

  it('disables import when nothing in the file can be linked or imported', async () => {
    const api = fakeImport([
      preview({
        tracks: 3,
        tracksInCatalog: 0,
        tracksToImport: 0,
        tracksMissing: 3,
        tracksUnsupported: 0,
        playlists: 0,
      }),
    ]);
    renderDialog(api);
    fireEvent.click(
      screen.getByRole('button', { name: /Choose library file/ }),
    );
    await screen.findByText(/0 of 3 tracks found/);
    expect(
      (screen.getByRole('button', { name: 'Import' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('lists every unresolved track by name, grouped by reason', async () => {
    await openPreview(fakeImport([preview()]));
    const list = screen.getByRole('region', {
      name: 'Tracks that were not resolved',
    });
    expect(
      within(list).getByText('Not resolved (5), first 2 listed'),
    ).toBeTruthy();
    expect(within(list).getByText('File not found (1)')).toBeTruthy();
    expect(within(list).getByText('Gone — A')).toBeTruthy();
    expect(within(list).getByText('Format not supported (1)')).toBeTruthy();
    expect(within(list).getByText('Protected — B')).toBeTruthy();
    expect(unresolvedAsText(preview().unresolved)).toBe(
      'File not found\tGone\tA\t/Volumes/Old/iTunes Media/Music/A/01 Gone.flac\n' +
        'Format not supported\tProtected\tB\t/Volumes/Old/iTunes Media/Music/B/Protected.m4p',
    );
  });

  it('shows the commit stage and count while importing, then unsubscribes', async () => {
    let report: (progress: NativeItunesImportProgress) => void = () => {};
    let finish: (value: NativeItunesImportResult) => void = () => {};
    const unsubscribe = vi.fn();
    const api: NativeItunesImport = {
      ...fakeImport([preview()]),
      commit: vi.fn(
        () =>
          new Promise<NativeItunesImportResult>((resolve) => {
            finish = resolve;
          }),
      ),
      onProgress: vi.fn((listener) => {
        report = listener;
        return unsubscribe;
      }),
    };
    await openPreview(api);
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    await screen.findByText(/Importing… Large libraries/);
    act(() => report({ stage: 'importing', done: 200, total: 1000 }));
    expect(screen.getByText('Importing files… 200 of 1,000')).toBeTruthy();
    act(() => report({ stage: 'playlists', done: 1, total: 2 }));
    expect(screen.getByText('Creating playlists… 1 of 2')).toBeTruthy();
    await act(async () => finish(result()));
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Creating playlists/)).toBeNull();
  });
});
