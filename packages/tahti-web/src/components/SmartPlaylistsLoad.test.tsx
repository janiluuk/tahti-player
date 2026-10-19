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
import { SmartPlaylists } from './SmartPlaylists';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('SmartPlaylists load failure', () => {
  afterEach(cleanup);

  it('says the smart playlists failed to load and can retry', async () => {
    const list = vi
      .fn()
      .mockRejectedValueOnce(new Error('library offline'))
      .mockResolvedValue([]);
    const library = {
      analysis: { smart: { list, evaluate: vi.fn() } },
      onLibraryChanged: () => () => undefined,
    } as unknown as TahtiNativeLibrary;
    await act(async () => {
      render(<SmartPlaylists library={library} onPlaylistCreated={() => {}} />);
    });
    expect(
      screen.getByText('Could not load your smart playlists'),
    ).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(
      screen.queryByText('Could not load your smart playlists'),
    ).toBeNull();
    expect(screen.getByText(/keep themselves up to date/)).toBeTruthy();
  });
});
