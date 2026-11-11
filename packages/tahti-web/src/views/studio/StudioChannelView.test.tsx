// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  RouterProvider,
} from '@tanstack/react-router';
import { act, fireEvent, screen } from '@testing-library/react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  channelTabRedirect,
  isChannelRadioTab,
} from '../../lib/channelSections';
import { useAuthStore } from '../../stores/authStore';
import { StudioChannelView } from './StudioChannelView';

vi.mock('../../api/studio-extras', () => ({
  fetchStatsPlays: async () => ({ data: { totalPlays: 0, totalDownloads: 0 } }),
}));

vi.mock('../../components/ChannelAnnouncementsPanel', () => ({
  ChannelAnnouncementsPanel: () => null,
}));
vi.mock('../../components/ChannelRadioPlaylistPanel', () => ({
  ChannelRadioPlaylistPanel: () => null,
}));
vi.mock('../../components/MultistreamStatusPanel', () => ({
  MultistreamStatusPanel: () => null,
}));
vi.mock('../../components/PinnedAnnouncementsPanel', () => ({
  PinnedAnnouncementsPanel: () => null,
}));
vi.mock('../../components/RotationSourcePicker', () => ({
  RotationSourcePicker: () => null,
}));
vi.mock('../../components/StreamManagerPanel', () => ({
  StreamManagerPanel: () => null,
}));
vi.mock('../../components/StudioRadioSubmissionPanel', () => ({
  StudioRadioSubmissionPanel: () => null,
}));
vi.mock('../admin/moderation/tabs/SelectsTab', () => ({
  SelectsTab: () => null,
}));
vi.mock('../settings/SettingsPanels', () => ({
  BroadcastPanel: () => null,
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

async function renderChannel(url: string, withChannel = true, board = false) {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      email: 'artist@tahti.live',
      username: 'artist',
      displayName: 'An Artist',
      role: board ? 'BOARD' : 'ARTIST',
      isBoard: board,
      isMember: true,
      channel: withChannel ? { slug: 'artist', state: 'OFFLINE' } : null,
    },
    hydrated: true,
    loading: false,
    profileLoaded: true,
  });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const channelRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/channel',
    validateSearch: (
      search: Record<string, unknown>,
    ): { tab?: string; radio?: string } => ({
      ...(typeof search.tab === 'string' ? { tab: search.tab } : {}),
      ...(isChannelRadioTab(search.radio) ? { radio: search.radio } : {}),
    }),
    beforeLoad: ({ search }) => {
      const target = channelTabRedirect(search.tab);
      if (target) {
        throw redirect(target as never);
      }
    },
    component: StudioChannelView,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([channelRoute]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return { router };
}

const clickTab = (name: string) =>
  act(async () => fireEvent.click(screen.getByRole('tab', { name })));

const sectionIds = () =>
  Array.from(document.querySelectorAll('section[id]')).map(
    (section) => section.id,
  );

describe('StudioChannelView sections', () => {
  it('shows Radio and Green room as sections of one page, with no section tabs', async () => {
    await renderChannel('/studio/channel');

    expect(sectionIds()).toEqual(['radio', 'green-room']);
    expect(screen.getByRole('heading', { name: 'Radio' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Green room' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Green room' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Stream' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('adds Selects for the board only', async () => {
    await renderChannel('/studio/channel', true, true);
    expect(sectionIds()).toEqual(['radio', 'green-room', 'selects']);
  });

  it('offers channel setup while there is no channel', async () => {
    await renderChannel('/studio/channel', false);
    expect(document.body.textContent).toContain('Create artist.tahti.live');
  });

  it('keeps the Radio tab in ?radio= and the #radio anchor', async () => {
    const { router } = await renderChannel('/studio/channel');

    await clickTab('Pinned');
    expect(router.state.location.search).toEqual({ radio: 'pinned' });
    expect(router.state.location.hash).toBe('radio');

    await clickTab('Stream');
    expect(router.state.location.search).toEqual({});
  });

  it.each([
    ['/studio/channel?tab=radio', {}, 'radio', 'Stream'],
    ['/studio/channel?tab=rotation', { radio: 'rotation' }, 'radio', '24/7'],
    [
      '/studio/channel?tab=announcements',
      { radio: 'rotation' },
      'radio',
      '24/7',
    ],
    ['/studio/channel?tab=pinned', { radio: 'pinned' }, 'radio', 'Pinned'],
    [
      '/studio/channel?tab=multicast',
      { radio: 'multicast' },
      'radio',
      'Multicast',
    ],
    ['/studio/channel?tab=green-room', {}, 'green-room', 'Stream'],
    ['/studio/channel?tab=setup', {}, '', 'Stream'],
  ])(
    'redirects the old %s to its section',
    async (url, search, hash, radioTab) => {
      const { router } = await renderChannel(url);
      expect(router.state.location.pathname).toBe('/studio/channel');
      expect(router.state.location.search).toEqual(search);
      expect(router.state.location.hash).toBe(hash);
      expect(screen.getByRole('tab', { name: radioTab })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    },
  );
});
