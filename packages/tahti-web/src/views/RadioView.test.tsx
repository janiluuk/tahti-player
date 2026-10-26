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

import { useLibraryStore } from '../stores/libraryStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';
import { RadioView } from './RadioView';

let recentFailure: string | null = null;
let stationFailure: string | null = null;
let relayLive = false;
let rotationFailure: string | null = null;
const ROTATION = [
  {
    id: 'rot-a',
    title: 'Polar Night',
    artistName: 'Northern Lights',
    artistUsername: 'northern-lights',
    artworkUrl: null,
  },
  {
    id: 'rot-b',
    title: 'Harbour Lights',
    artistName: 'Kuudes Linja',
    artistUsername: null,
    artworkUrl: null,
  },
];

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
      data: relayLive
        ? {
            live: true,
            channel: {
              slug: 'moon',
              displayName: 'DJ Moon',
              title: 'Moon set',
            },
          }
        : { live: false, channel: null },
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
    fetchRadioShowUpcoming: async () => ({
      data: rotationFailure ? [] : ROTATION,
      meta: rotationFailure
        ? { source: 'api' as const, reason: rotationFailure }
        : { source: 'api' as const },
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

describe('RadioView up next', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    relayLive = false;
    rotationFailure = null;
  });

  const renderRadio = async () => {
    const router = createRouter({
      routeTree: createRootRoute({ component: RadioView }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
  };

  it('lists the rotation tracks coming next while the rotation plays', async () => {
    await renderRadio();
    const rotation = await screen.findByTestId('radio-up-next-rotation');
    const items = within(rotation).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('Polar Night'),
      expect.stringContaining('Harbour Lights'),
    ]);
    expect(
      within(rotation)
        .getByRole('link', { name: 'Northern Lights' })
        .getAttribute('href'),
    ).toBe('/u/northern-lights');
    expect(screen.getByRole('tab', { name: /Up next/ }).textContent).toContain(
      '2',
    );
  });

  it('hides the rotation while a member is live on the relay', async () => {
    relayLive = true;
    await renderRadio();
    await screen.findByTestId('radio-up-next-shows');
    expect(screen.queryByTestId('radio-up-next-rotation')).toBeNull();
  });

  it('says the rotation failed to load instead of showing nothing', async () => {
    rotationFailure = 'HTTP 503';
    await renderRadio();
    const rotation = await screen.findByTestId('radio-up-next-rotation');
    expect(
      within(rotation).getByText('Could not load the rotation'),
    ).toBeTruthy();
  });
});

describe('RadioView internet radio stations', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    useLibraryStore.setState({ favoriteTracks: [] });
    useSettingsModalStore.setState({ isOpen: false });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  const renderRadio = async () => {
    const router = createRouter({
      routeTree: createRootRoute({ component: RadioView }),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
  };

  it('shows the station row and keeps favorites in their own row', async () => {
    await renderRadio();
    expect(screen.queryByTestId('radio-favorites')).toBeNull();
    const row = screen.getByTestId('radio-stations-row');
    const helsinki = within(row)
      .getByRole('link', { name: 'Radio Helsinki' })
      .closest('[data-testid="card"]') as HTMLElement;
    await act(async () => {
      fireEvent.click(
        within(helsinki).getByRole('button', { name: 'Favorite' }),
      );
    });
    const favorites = screen.getByTestId('radio-favorites');
    expect(
      within(favorites).getByRole('link', { name: 'Radio Helsinki' }),
    ).toBeTruthy();
  });

  it('opens the radio directory from the add stations area', async () => {
    await renderRadio();
    const panel = screen.getByTestId('radio-add-stations');
    fireEvent.click(
      within(panel).getByRole('button', { name: /Browse stations/ }),
    );
    const state = useSettingsModalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.activeTab).toBe('plugin-store');
    expect(state.pluginCategory).toBe('radio');
  });
});
