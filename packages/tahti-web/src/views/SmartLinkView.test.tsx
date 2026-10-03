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
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import * as clicks from '../api/smart-link-clicks';
import { SmartLinkView } from './SmartLinkView';

async function renderSmartLink(release: Record<string, unknown>) {
  vi.spyOn(client, 'fetchSmartLink').mockResolvedValue({
    data: {
      release: {
        id: 'r1',
        title: 'Night Drive',
        smartLinkSlug: 'night-drive',
        artworkUrl: null,
        ...release,
      },
      artist: { username: 'tahti', displayName: 'Tahti', avatarUrl: null },
      targets: {},
      featuredCollections: [],
      releaseUrl: '/r/night-drive',
    } as never,
    meta: { source: 'api' },
  });
  vi.spyOn(client, 'fetchProfile').mockRejectedValue(new Error('offline'));
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <SmartLinkView slug="night-drive" />,
    }),
    history: createMemoryHistory({ initialEntries: ['/r/night-drive'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('SmartLinkView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the "Powered by Tahti" footer linking home when turned on', async () => {
    await renderSmartLink({ showPoweredByFooter: true });
    const link = screen.getByRole('link', { name: 'Powered by Tahti' });
    expect(link.getAttribute('href')).toBe('/');
  });

  it('falls back to the Tahti release link when there are no services', async () => {
    await renderSmartLink({});
    const link = within(
      screen.getByRole('region', { name: 'Listen on' }),
    ).getByRole('link', { name: 'Tahti' });
    expect(link.getAttribute('href')).toBe('/r/night-drive');
    expect(link.getAttribute('target')).toBeNull();
  });

  it('hides the footer when it is off or missing', async () => {
    await renderSmartLink({ showPoweredByFooter: false });
    expect(screen.queryByText('Powered by Tahti')).toBeNull();
    cleanup();
    vi.restoreAllMocks();
    await renderSmartLink({});
    expect(screen.queryByText('Powered by Tahti')).toBeNull();
  });

  it('records a click through to a streaming service', async () => {
    vi.spyOn(client, 'fetchSmartLink').mockResolvedValue({
      data: {
        release: {
          id: 'r1',
          title: 'Night Drive',
          smartLinkSlug: 'night-drive',
          artworkUrl: null,
        },
        artist: { username: 'tahti', displayName: 'Tahti', avatarUrl: null },
        targets: { spotify: 'https://open.spotify.com/album/x', tidal: '' },
        featuredCollections: [],
        releaseUrl: '/r/night-drive',
      } as never,
      meta: { source: 'api' },
    });
    vi.spyOn(client, 'fetchProfile').mockRejectedValue(new Error('offline'));
    const record = vi
      .spyOn(clicks, 'recordSmartLinkClick')
      .mockImplementation(() => {});
    const router = createRouter({
      routeTree: createRootRoute({
        component: () => <SmartLinkView slug="night-drive" />,
      }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    const link = screen.getByRole('link', { name: /Spotify/ });
    expect(link.getAttribute('target')).toBe('_blank');
    fireEvent.click(link);
    expect(record).toHaveBeenCalledWith('night-drive', 'spotify');
    expect(screen.queryByRole('link', { name: /Tidal/ })).toBeNull();
  });
});
