// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as catalog from '../api/catalog-search';
import { useAuthStore } from '../stores/authStore';
import { CollaborativePlaylistAdd } from './CollaborativePlaylistAdd';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

async function renderAdd(onAdded = vi.fn()) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <CollaborativePlaylistAdd
          slug="road-trip"
          existingSoundIds={[]}
          onAdded={onAdded}
        />
      ),
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return onAdded;
}

describe('CollaborativePlaylistAdd', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null } as never);
  });

  it('asks signed-out listeners to sign in', async () => {
    useAuthStore.setState({ user: null } as never);
    await renderAdd();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeTruthy();
    expect(screen.queryByLabelText('Search the catalog')).toBeNull();
  });

  it('adds a found track with the note', async () => {
    useAuthStore.setState({
      user: { username: 'fan', displayName: 'Fan' },
    } as never);
    vi.spyOn(catalog, 'searchCatalogTracks').mockResolvedValue({
      ok: true,
      tracks: [
        {
          id: 's1',
          title: 'Midnight Ferry',
          durationSec: 245,
          artistName: 'Aino',
          channelSlug: 'aino',
        },
      ],
      hasMore: false,
    });
    const add = vi
      .spyOn(catalog, 'addTrackToCollaborativePlaylist')
      .mockResolvedValue({ ok: true });
    const onAdded = await renderAdd();
    fireEvent.change(screen.getByLabelText('Note (optional)'), {
      target: { value: 'Perfect for the ferry' },
    });
    fireEvent.change(screen.getByLabelText('Search the catalog'), {
      target: { value: 'ferry' },
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Add Midnight Ferry by Aino' }),
    );
    await vi.waitFor(() => expect(onAdded).toHaveBeenCalled());
    expect(add).toHaveBeenCalledWith(
      'road-trip',
      's1',
      'Perfect for the ferry',
    );
    expect(screen.getByLabelText('Note (optional)')).toHaveProperty(
      'value',
      '',
    );
  });
});
