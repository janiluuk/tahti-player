// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as studio from '../../api/studio';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { StudioPlaylistsView } from './StudioPlaylistsView';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../LibraryView', () => ({
  LibrarySectionTabs: () => null,
}));

describe('StudioPlaylistsView', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'artist@tahti.live',
        username: 'artist',
        displayName: 'An Artist',
        role: 'ARTIST',
        isBoard: false,
        isMember: true,
        channel: { slug: 'artist', state: 'OFFLINE' },
      },
      hydrated: true,
      loading: false,
      profileLoaded: true,
    });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null, hydrated: true, loading: false });
  });

  it('says the playlists failed to load instead of "No playlists yet"', async () => {
    const fetch = vi.spyOn(studio, 'fetchStudioCollections').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await renderWithRouter(<StudioPlaylistsView />);
    expect(
      await screen.findByText('Could not load your playlists'),
    ).toBeTruthy();
    expect(screen.queryByText('No playlists yet')).toBeNull();

    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No playlists yet')).toBeTruthy();
  });

  it('offers Undo after creating a playlist, which deletes it', async () => {
    vi.spyOn(studio, 'fetchStudioCollections').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    vi.spyOn(studio, 'createStudioCollection').mockResolvedValue({
      ok: true,
      data: { slug: 'warmup', name: 'Warmup', style: 'PLAYLIST' },
    } as never);
    const remove = vi
      .spyOn(studio, 'deleteStudioCollection')
      .mockResolvedValue({ ok: true });
    await renderWithRouter(<StudioPlaylistsView />);

    await act(async () =>
      fireEvent.click(
        screen.getAllByRole('button', { name: 'New playlist' })[0]!,
      ),
    );
    await act(async () =>
      fireEvent.change(screen.getByLabelText('Name'), {
        target: { value: 'Warmup' },
      }),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Create' })),
    );

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    const [message, options] = vi.mocked(toast.success).mock.calls.at(-1) as [
      string,
      { action: { label: string; onClick: () => void } },
    ];
    expect(message).toBe('Created Warmup.');
    expect(options.action.label).toBe('Undo');
    await act(async () => options.action.onClick());

    await waitFor(() => expect(remove).toHaveBeenCalledWith('warmup'));
    expect(toast.success).toHaveBeenLastCalledWith('Removed Warmup.');
  });
});
