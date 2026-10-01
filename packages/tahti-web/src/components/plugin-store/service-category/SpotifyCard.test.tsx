import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServicePlugin } from '../serviceCatalog';
import { SpotifyCard } from './SpotifyCard';

const { toast, api } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
  api: {
    fetchSpotifyArtistProfile: vi.fn(),
    linkSpotifyArtistProfile: vi.fn(),
    unlinkSpotifyArtistProfile: vi.fn(),
  },
}));

vi.mock('sonner', () => ({ toast, Toaster: () => null }));
vi.mock('../../../api/distribution', () => api);

const plugin = {
  id: 'spotify',
  name: 'Spotify',
  author: 'Tahti',
  description: '',
  action: { kind: 'info' },
} as unknown as ServicePlugin;

const renderCard = () =>
  render(
    <RouterProvider
      router={createRouter({
        routeTree: createRootRoute({
          component: () => <SpotifyCard plugin={plugin} />,
        }),
        history: createMemoryHistory({ initialEntries: ['/'] }),
      })}
    />,
  );

const openPanel = async () => {
  const buttons = await screen.findAllByRole('button', { name: 'Configure' });
  fireEvent.click(buttons[buttons.length - 1]!); // the gear beside the card
};

const load = (profile: { name?: string } | null, configured = true) =>
  api.fetchSpotifyArtistProfile.mockResolvedValue({
    data: { configured, profile },
  });

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe('SpotifyCard', () => {
  it('opens the config panel, not the import dialog, when no profile is linked', async () => {
    load(null);
    renderCard();
    // The card's own primary button (not the gear) is "Configure" here.
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Configure' }))[0]!,
    );
    expect(await screen.findByText('Configure Spotify')).toBeTruthy();
    expect(screen.queryByText('Choose Spotify content')).toBeNull();
  });

  it('toasts a link error instead of hiding it', async () => {
    load(null);
    api.linkSpotifyArtistProfile.mockResolvedValue({
      ok: false,
      error: 'Not a Spotify artist URL',
    });
    renderCard();
    await openPanel();
    fireEvent.change(await screen.findByLabelText('Spotify artist URL'), {
      target: { value: 'nope' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Link profile' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Not a Spotify artist URL'),
    );
    // busy is released so the user can retry
    expect(
      (
        screen.getByRole('button', {
          name: 'Link profile',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  it('sends a linked artist to the collection editor to add tracks', async () => {
    load({ name: 'Artist' });
    renderCard();
    await openPanel();
    const link = await screen.findByRole('link', {
      name: /Add to a collection/,
    });
    expect(link.getAttribute('href')).toBe('/studio/collections');
  });

  it('unlink failure toasts and keeps the profile', async () => {
    load({ name: 'Artist' });
    api.unlinkSpotifyArtistProfile.mockRejectedValue(new Error('x'));
    renderCard();
    await openPanel();
    fireEvent.click(await screen.findByRole('button', { name: 'Unlink' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not unlink the Spotify profile.',
      ),
    );
    expect(screen.getByText(/Linked: Artist/)).toBeTruthy();
  });
});
