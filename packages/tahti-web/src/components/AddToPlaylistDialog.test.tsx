// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TahtiNativeLibrary } from '../lib/nativeLibrary';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('AddToPlaylistDialog', () => {
  afterEach(cleanup);

  it('says the playlists failed to load instead of "No playlists yet"', async () => {
    const list = vi
      .fn()
      .mockRejectedValueOnce(new Error('library offline'))
      .mockResolvedValueOnce([]);
    const library = { playlists: { list } } as unknown as TahtiNativeLibrary;
    await act(async () => {
      render(
        <AddToPlaylistDialog
          isOpen
          onClose={() => {}}
          library={library}
          resolveTrackIds={async () => []}
          summary="1 track"
        />,
      );
    });
    expect(screen.getByText('Could not load your playlists')).toBeTruthy();
    expect(screen.queryByText(/No playlists yet/)).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(screen.getByText(/No playlists yet/)).toBeTruthy();
  });
});
