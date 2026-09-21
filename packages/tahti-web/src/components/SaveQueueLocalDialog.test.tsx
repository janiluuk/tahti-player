import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { TahtiPlayable } from '../api/types';
import type { TahtiNativeLibrary } from '../lib/nativeLibrary';
import { usePlayerStore } from '../stores/playerStore';
import { createFakePlaylists } from '../test/fakePlaylists';
import { localQueueSplit, SaveQueueLocalDialog } from './SaveQueueLocalDialog';

const local = (id: string): TahtiPlayable => ({
  id: `local:${id}`,
  kind: 'sound',
  title: `Local ${id}`,
  artist: 'Me',
  streamUrl: `asset://${id}`,
  protocol: 'https',
  sourceProvider: 'local',
  durationSec: 60,
});
const cloud = (id: string): TahtiPlayable => ({
  id: `sound:${id}`,
  kind: 'sound',
  title: `Cloud ${id}`,
  artist: 'Them',
  streamUrl: `https://example.test/${id}.mp3`,
  protocol: 'https',
  durationSec: 60,
});

afterEach(() => {
  cleanup();
  usePlayerStore.getState().clearQueue();
});

describe('localQueueSplit', () => {
  it('keeps local track ids in queue order and counts the streamed ones', () => {
    expect(
      localQueueSplit(['local:a', 'sound:1', 'local:b', 'radio:x']),
    ).toEqual({
      trackIds: ['a', 'b'],
      streamed: 2,
    });
    expect(localQueueSplit([])).toEqual({ trackIds: [], streamed: 0 });
  });
});

describe('SaveQueueLocalDialog', () => {
  it('saves the local tracks in queue order and says what it left out', async () => {
    const fake = createFakePlaylists({
      a: { title: 'Local a' },
      b: { title: 'Local b' },
    });
    usePlayerStore
      .getState()
      .play(local('b'), { enqueueRest: [cloud('1'), local('a')] });
    render(
      <SaveQueueLocalDialog
        isOpen
        onClose={() => undefined}
        library={{ playlists: fake.api } as unknown as TahtiNativeLibrary}
      />,
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/1 streamed track/)).toBeTruthy();
    expect(
      within(dialog).getByText(/Save queue to cloud playlist/),
    ).toBeTruthy();
    fireEvent.change(within(dialog).getByLabelText('Playlist name'), {
      target: { value: 'Saved queue' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Save local playlist' }),
    );

    await waitFor(() =>
      expect(fake.api.addTracks).toHaveBeenCalledWith('pl-1', ['b', 'a']),
    );
    expect(fake.titles('pl-1')).toEqual(['Local b', 'Local a']);
  });

  it('cannot save when the queue has no local tracks, and reports a name clash', async () => {
    const fake = createFakePlaylists({ a: { title: 'Local a' } });
    await fake.api.create('Taken');
    usePlayerStore.getState().play(cloud('1'));
    const { rerender } = render(
      <SaveQueueLocalDialog
        isOpen
        onClose={() => undefined}
        library={{ playlists: fake.api } as unknown as TahtiNativeLibrary}
      />,
    );
    const empty = await screen.findByRole('dialog');
    fireEvent.change(within(empty).getByLabelText('Playlist name'), {
      target: { value: 'Anything' },
    });
    expect(
      within(empty)
        .getByRole('button', { name: 'Save local playlist' })
        .hasAttribute('disabled'),
    ).toBe(true);

    usePlayerStore.getState().play(local('a'));
    rerender(
      <SaveQueueLocalDialog
        isOpen
        onClose={() => undefined}
        library={{ playlists: fake.api } as unknown as TahtiNativeLibrary}
      />,
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Playlist name'), {
      target: { value: 'taken' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Save local playlist' }),
    );
    expect(
      await within(dialog).findByText(
        'A playlist with that name already exists.',
      ),
    ).toBeTruthy();
  });
});
