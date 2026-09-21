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
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { usePlayerStore } from '../stores/playerStore';
import { createFakePlaylists } from '../test/fakePlaylists';
import { LocalPlaylists } from './LocalPlaylists';

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
