// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import { SmartLinkView } from './SmartLinkView';

describe('SmartLinkView streaming services', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('names Deezer, Amazon Music and Mixcloud links', async () => {
    vi.spyOn(client, 'fetchSmartLink').mockResolvedValue({
      data: {
        release: { id: 'r1', title: 'Night Drive', smartLinkSlug: 'nd' },
        artist: { username: 'tahti', displayName: 'Tahti', avatarUrl: null },
        targets: {
          deezer: 'https://www.deezer.com/album/1',
          amazon: 'https://music.amazon.com/albums/2',
          mixcloud: 'https://www.mixcloud.com/tahti/night-drive/',
        },
        featuredCollections: [],
        releaseUrl: '/r/nd',
      } as never,
      meta: { source: 'api' },
    });
    vi.spyOn(client, 'fetchProfile').mockRejectedValue(new Error('offline'));
    const router = createRouter({
      routeTree: createRootRoute({
        component: () => <SmartLinkView slug="nd" />,
      }),
      history: createMemoryHistory({ initialEntries: ['/r/nd'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    const services = within(screen.getByRole('region', { name: 'Listen on' }));
    expect(
      services.getByRole('link', { name: /Deezer/ }).getAttribute('href'),
    ).toBe('https://www.deezer.com/album/1');
    expect(services.getByRole('link', { name: /Amazon Music/ })).toBeTruthy();
    expect(
      services.getByRole('link', { name: /Mixcloud/ }).getAttribute('href'),
    ).toBe('https://www.mixcloud.com/tahti/night-drive/');
  });
});
