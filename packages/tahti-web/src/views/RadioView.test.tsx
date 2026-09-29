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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RadioView } from './RadioView';

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return {
    ...actual,
    fetchRadio: async () => ({
      data: { live: false, channel: null },
      meta: { source: 'api' as const },
    }),
    fetchRadioRecentlyPlayed: async () => ({
      data: [],
      meta: { source: 'api' as const },
    }),
    fetchRadioFeatureHistory: async () => ({
      data: [
        {
          channelId: 'c1',
          slug: 'moon',
          artistName: 'DJ Moon',
          featuredAt: new Date(Date.now() - 3600_000).toISOString(),
        },
      ],
      meta: { source: 'api' as const },
    }),
  };
});

vi.mock('../components/ChannelVisualizer', () => ({
  ChannelVisualizer: () => null,
}));

vi.mock('../api/shows', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/shows')>();
  return {
    ...actual,
    fetchShowBookings: async () => ({
      data: [],
      meta: { source: 'api' as const },
    }),
  };
});

describe('RadioView featured history', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('lists the member channels Tahti Radio relayed, linked to their channel', async () => {
    const router = createRouter({
      routeTree: createRootRoute({ component: RadioView }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Featured/ }));
    });
    const list = screen.getByTestId('radio-featured');
    const link = within(list).getByRole('link', { name: 'DJ Moon' });
    expect(link.getAttribute('href')).toBe('/channel/moon');
  });
});
