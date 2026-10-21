import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type {
  NativeImportPreview,
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { usePlayerStore } from '../stores/playerStore';
import { createFakePlaylists } from '../test/fakePlaylists';
import { LocalPlaylists } from './LocalPlaylists';
import { describeExport } from './PlaylistExportDialog';
import { describePreview } from './PlaylistImportDialog';

const TRACKS = {
  a: { title: 'Alpha', artist: 'Ann' },
  b: { title: 'Beta', artist: 'Bo' },
  c: { title: 'Gamma', artist: 'Cy' },
  d: { title: 'Delta', artist: 'Di' },
};

function setup() {
  const fake = createFakePlaylists(TRACKS);
  const prepareBatch = vi.fn(async (ids: string[]) => ({
    unavailable: 0,
    items: ids.map((id) => ({
      track: {
        id,
        title: TRACKS[id as keyof typeof TRACKS].title,
        artist: TRACKS[id as keyof typeof TRACKS].artist,
        available: true,
      } as NativeLibraryTrack,
      streamUrl: `asset://${id}`,
    })),
  }));
  const library = {
    playlists: fake.api,
    prepareBatch,
    analysis: {
      smart: { list: vi.fn().mockResolvedValue([]) },
    },
  } as unknown as TahtiNativeLibrary;
  function Harness({ initialOpen = null }: { initialOpen?: string | null }) {
    const [openId, setOpenId] = useState<string | null>(initialOpen);
    return (
      <LocalPlaylists
        library={library}
        openId={openId}
        onOpenChange={setOpenId}
      />
    );
  }
  return { fake, library, prepareBatch, Harness };
}

const queueTitles = () =>
  usePlayerStore.getState().queue.map((item) => item.track.title);

beforeAll(() => {
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
});

async function seededPlaylist(trackIds = ['a', 'b', 'c', 'd']) {
  const ctx = setup();
  const playlist = await ctx.fake.api.create('Night drive');
  await ctx.fake.api.addTracks(playlist.id, trackIds);
  return { ...ctx, playlist };
}

describe('playlist list', () => {
  it('starts empty, creates playlists and rejects a duplicate name', async () => {
    const { Harness } = setup();
    render(<Harness />);
    expect(await screen.findByText('No playlists yet')).toBeTruthy();

    fireEvent.click(
      screen.getAllByRole('button', { name: 'New playlist' })[0] as HTMLElement,
    );
    let dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Night drive' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Night drive')).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(screen.getByRole('button', { name: 'New playlist' }));
    dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'night DRIVE' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    expect(
      await within(dialog).findByText(
        'A playlist with that name already exists.',
      ),
    ).toBeTruthy();
  });

  it('renames, duplicates and deletes (after confirming)', async () => {
    const { fake, Harness, playlist } = await seededPlaylist();
    render(<Harness />);
    await screen.findByText('Night drive');
    expect(screen.getByText('4 tracks · 7 min')).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', { name: 'Duplicate Night drive' }),
    );
    expect(await screen.findByText('Night drive copy')).toBeTruthy();
    expect(fake.titles(playlist.id)).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
      'Delta',
    ]);

    fireEvent.click(
      screen.getByRole('button', { name: 'Rename Night drive copy' }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Focus' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Rename' }));
    expect(await screen.findByText('Focus')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Focus' }));
    expect(fake.api.delete).not.toHaveBeenCalled();
    const confirm = await screen.findByRole('dialog');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByText('Focus')).toBeNull());
    expect(screen.getByText('Night drive')).toBeTruthy();
  });

  it('plays and shuffles a playlist from the list', async () => {
    const { Harness } = await seededPlaylist();
    render(<Harness />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Play Night drive' }),
    );
    await waitFor(() =>
      expect(queueTitles()).toEqual(['Alpha', 'Beta', 'Gamma', 'Delta']),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Shuffle Night drive' }),
    );
    await waitFor(() => expect(queueTitles()).toHaveLength(4));
    expect([...queueTitles()].sort()).toEqual([
      'Alpha',
      'Beta',
      'Delta',
      'Gamma',
    ]);
  });
});

describe('opened playlist', () => {
  it('shows entries in order, flags unavailable ones and keeps them', async () => {
    const { fake, Harness, playlist } = await seededPlaylist();
    fake.markMissing('b');
    render(<Harness initialOpen={playlist.id} />);
    expect(await screen.findByText('Alpha')).toBeTruthy();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Alpha'),
      expect.stringContaining('Beta'),
      expect.stringContaining('Gamma'),
      expect.stringContaining('Delta'),
    ]);
    expect(screen.getAllByText('Unavailable')).toHaveLength(1);
    expect(screen.getByText('4 tracks · 7 min · 1 unavailable')).toBeTruthy();
  });

  it('plays from the chosen entry, wrapping to the start', async () => {
    const { Harness, playlist } = await seededPlaylist();
    render(<Harness initialOpen={playlist.id} />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Play Gamma from here' }),
    );
    await waitFor(() =>
      expect(queueTitles()).toEqual(['Gamma', 'Delta', 'Alpha', 'Beta']),
    );
  });

  it('reorders with Alt+arrows and undoes it', async () => {
    const { fake, Harness, playlist } = await seededPlaylist();
    render(<Harness initialOpen={playlist.id} />);
    await screen.findByText('Alpha');
    const rows = screen.getByLabelText('Rows');
    fireEvent.keyDown(rows, { key: 'ArrowDown' });
    fireEvent.keyDown(rows, { key: 'ArrowDown', altKey: true });
    await waitFor(() =>
      expect(fake.titles(playlist.id)).toEqual([
        'Beta',
        'Alpha',
        'Gamma',
        'Delta',
      ]),
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Undo' }));
    await waitFor(() =>
      expect(fake.titles(playlist.id)).toEqual([
        'Alpha',
        'Beta',
        'Gamma',
        'Delta',
      ]),
    );
  });

  it('removes several entries at once and brings them back with Ctrl+Z, repeats included', async () => {
    const { fake, Harness, playlist } = await seededPlaylist([
      'a',
      'b',
      'a',
      'c',
    ]);
    render(<Harness initialOpen={playlist.id} />);
    await screen.findByText('Gamma');
    const boxes = screen.getAllByLabelText('Select Alpha');
    fireEvent.click(boxes[0] as HTMLElement);
    fireEvent.click(boxes[1] as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(fake.titles(playlist.id)).toEqual(['Beta', 'Gamma']),
    );

    fireEvent.keyDown(screen.getByTestId('playlist-view'), {
      key: 'z',
      ctrlKey: true,
    });
    await waitFor(() =>
      expect(fake.titles(playlist.id)).toEqual([
        'Alpha',
        'Beta',
        'Alpha',
        'Gamma',
      ]),
    );
  });

  it('removes a single entry from its row', async () => {
    const { fake, Harness, playlist } = await seededPlaylist();
    render(<Harness initialOpen={playlist.id} />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove Beta from playlist' }),
    );
    await waitFor(() =>
      expect(fake.titles(playlist.id)).toEqual(['Alpha', 'Gamma', 'Delta']),
    );
    expect(fake.api.restoreEntries).not.toHaveBeenCalled();
  });

  it('shows an empty state for an empty playlist and goes back to the list', async () => {
    const { fake, Harness } = setup();
    const empty = await fake.api.create('Empty');
    render(<Harness initialOpen={empty.id} />);
    expect(await screen.findByText('This playlist is empty')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Playlists' }));
    expect(await screen.findByRole('list', { name: 'Playlists' })).toBeTruthy();
  });

  it('deletes the open playlist after confirming and returns to the list', async () => {
    const { fake, Harness, playlist } = await seededPlaylist();
    render(<Harness initialOpen={playlist.id} />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete playlist' }),
    );
    const confirm = await screen.findByRole('dialog');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(fake.api.delete).toHaveBeenCalledWith(playlist.id),
    );
    expect(await screen.findByText('No playlists yet')).toBeTruthy();
  });
});

const preview = (
  over: Partial<NativeImportPreview> = {},
): NativeImportPreview => ({
  sourcePath: '/lists/mix.m3u8',
  suggestedName: 'Mix',
  total: 5,
  linked: 2,
  needsImport: 1,
  missing: 1,
  unsupported: 1,
  remote: 0,
  unresolved: [
    { line: 3, path: '/new/fresh.wav', title: 'Fresh', status: 'needsImport' },
    { line: 4, path: '/gone/x.wav', title: 'Gone', status: 'missing' },
    { line: 5, path: '/new/song.mp3', title: 'Song', status: 'unsupported' },
  ],
  ...over,
});

describe('export and import', () => {
  it('describes what an export means for moving the file', () => {
    const base = {
      path: '/out/a.m3u8',
      written: 3,
      outsideRoot: 0,
      absoluteFallback: 0,
    };
    expect(describeExport(base, 'relative').description).toMatch(
      /keeps working if you move it together/,
    );
    expect(
      describeExport(
        { ...base, outsideRoot: 2, absoluteFallback: 1 },
        'relative',
      ).description,
    ).toMatch(
      /2 files are outside the folder .* written with \.\.\/.*1 file is on another drive/,
    );
    expect(describeExport(base, 'absolute').description).toMatch(
      /different folder layout/,
    );
    expect(describeExport({ ...base, written: 1 }, 'absolute').title).toBe(
      'Exported 1 track to /out/a.m3u8',
    );
  });

  it('summarises an import preview', () => {
    expect(describePreview(preview())).toBe(
      '2 of 5 already in your library · 1 not imported yet · 1 not found · 1 unsupported',
    );
    expect(
      describePreview(
        preview({
          needsImport: 0,
          missing: 0,
          unsupported: 0,
          remote: 2,
          linked: 3,
          total: 5,
        }),
      ),
    ).toBe('3 of 5 already in your library · 2 stream URLs');
  });

  it('exports with relative or full paths as chosen', async () => {
    const { fake, Harness, playlist } = await seededPlaylist();
    render(<Harness />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Export Night drive' }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(
        /keeps working if the file and the music move together/,
      ),
    ).toBeTruthy();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Choose where to save…' }),
    );
    await waitFor(() =>
      expect(fake.api.exportM3u).toHaveBeenCalledWith(playlist.id, 'relative'),
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Export Night drive' }));
    const again = await screen.findByRole('dialog');
    fireEvent.click(within(again).getByText('Full paths'));
    fireEvent.click(
      within(again).getByRole('button', { name: 'Choose where to save…' }),
    );
    await waitFor(() =>
      expect(fake.api.exportM3u).toHaveBeenLastCalledWith(
        playlist.id,
        'absolute',
      ),
    );
  });

  it('does nothing when the file picker is cancelled', async () => {
    const { fake, Harness } = setup();
    render(<Harness />);
    fireEvent.click(await screen.findByRole('button', { name: 'Import…' }));
    await waitFor(() => expect(fake.api.importPreview).toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('previews an import, keeps unresolved entries visible, and imports with the chosen options', async () => {
    const { fake, Harness } = setup();
    fake.api.importPreview.mockResolvedValueOnce(preview());
    render(<Harness />);
    fireEvent.click(await screen.findByRole('button', { name: 'Import…' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/2 of 5 already in your library/),
    ).toBeTruthy();
    expect(
      (within(dialog).getByLabelText('Playlist name') as HTMLInputElement)
        .value,
    ).toBe('Mix');
    const list = within(dialog).getByRole('list', {
      name: 'Unresolved entries',
    });
    expect(
      within(list).getByText('Fresh').parentElement?.textContent,
    ).toContain('Not in library yet');
    expect(within(list).getByText('Gone').parentElement?.textContent).toContain(
      'File not found',
    );
    expect(within(list).getByText('Song').parentElement?.textContent).toContain(
      'Unsupported format',
    );

    fireEvent.change(within(dialog).getByLabelText('Playlist name'), {
      target: { value: 'My mix' },
    });
    fireEvent.click(
      within(dialog).getByRole('switch', { name: 'Add files to the library' }),
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Import playlist' }),
    );

    await waitFor(() =>
      expect(fake.api.importCommit).toHaveBeenCalledWith(
        '/lists/mix.m3u8',
        'My mix',
        false,
        null,
      ),
    );
    expect(await screen.findByTestId('playlist-view')).toBeTruthy();
  });

  it('searches a folder for missing files and passes it to the import', async () => {
    const { fake, Harness } = setup();
    fake.api.importPreview
      .mockResolvedValueOnce(preview())
      .mockResolvedValueOnce(
        preview({ missing: 0, needsImport: 2, unresolved: [] }),
      );
    fake.api.pickRelinkFolder.mockResolvedValueOnce('/backup/Music');
    render(<Harness />);
    fireEvent.click(await screen.findByRole('button', { name: 'Import…' }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Find missing files in a folder…',
      }),
    );
    await waitFor(() =>
      expect(fake.api.importPreview).toHaveBeenLastCalledWith(
        '/lists/mix.m3u8',
        '/backup/Music',
      ),
    );
    expect(
      await within(dialog).findByText('Searching /backup/Music'),
    ).toBeTruthy();

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Import playlist' }),
    );
    await waitFor(() =>
      expect(fake.api.importCommit).toHaveBeenCalledWith(
        '/lists/mix.m3u8',
        'Mix',
        true,
        '/backup/Music',
      ),
    );
  });

  it('shows a name clash in the dialog and stays open', async () => {
    const { fake, Harness } = setup();
    fake.api.importPreview.mockResolvedValueOnce(preview());
    fake.api.importCommit.mockRejectedValueOnce(
      new Error('A playlist with that name already exists.'),
    );
    render(<Harness />);
    fireEvent.click(await screen.findByRole('button', { name: 'Import…' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Import playlist' }),
    );
    expect(
      await within(dialog).findByText(
        'A playlist with that name already exists.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('links an unavailable entry to a file the user locates', async () => {
    const { fake, Harness, playlist } = await seededPlaylist();
    fake.markMissing('b');
    fake.api.relinkEntry.mockResolvedValueOnce(true);
    render(<Harness initialOpen={playlist.id} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Locate Beta' }));
    await waitFor(() =>
      expect(fake.api.relinkEntry).toHaveBeenCalledWith(
        playlist.id,
        expect.any(String),
      ),
    );
    expect(screen.queryByRole('button', { name: 'Locate Alpha' })).toBeNull();
  });
});
