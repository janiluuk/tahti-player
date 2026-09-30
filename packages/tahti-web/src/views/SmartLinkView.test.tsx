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

import * as client from '../api/client';
import * as clicks from '../api/smart-link-clicks';
import { SmartLinkView } from './SmartLinkView';

describe('SmartLinkView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
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
