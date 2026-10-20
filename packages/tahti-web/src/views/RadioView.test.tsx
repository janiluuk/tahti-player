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

let recentFailure: string | null = null;
let stationFailure: string | null = null;

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>();
  return {
    ...actual,
    fetchRadioStation: async () => {
      if (stationFailure) {
        throw new Error(stationFailure);
      }
      return actual.fetchRadioStation();
    },
    fetchRadio: async () => ({
      data: { live: false, channel: null },
      meta: { source: 'api' as const },
    }),
    fetchRadioRecentlyPlayed: async () => ({
      data: [],
      meta: recentFailure
        ? { source: 'api' as const, reason: recentFailure }
        : { source: 'api' as const },
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

describe('RadioView failed sections', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    recentFailure = null;
  });

  it('says recent plays failed to load instead of "No recent plays"', async () => {
    recentFailure = 'HTTP 502';
    const router = createRouter({
      routeTree: createRootRoute({ component: RadioView }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Just played/ }));
    });
    expect(screen.getByText('Could not load recent plays')).toBeTruthy();
    expect(screen.queryByText('No recent plays logged yet.')).toBeNull();

    recentFailure = null;
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Just played/ }));
    });
    expect(screen.getByText('No recent plays logged yet.')).toBeTruthy();
  });
});

describe('RadioView station failure', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    stationFailure = null;
  });

  it('shows a retryable error instead of the offline empty state when the station fetch fails', async () => {
    stationFailure = 'HTTP 503';
    const router = createRouter({
      routeTree: createRootRoute({ component: RadioView }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    expect(screen.getByTestId('radio-view')).toBeTruthy();
    expect(screen.getByText('Could not load Tahti Radio')).toBeTruthy();
    expect(screen.getByText('HTTP 503')).toBeTruthy();
    expect(screen.queryByText('Radio unavailable')).toBeNull();

    stationFailure = null;
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(screen.queryByText('Could not load Tahti Radio')).toBeNull();
  });
});
