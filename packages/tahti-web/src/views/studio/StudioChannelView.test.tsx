// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, fireEvent, screen } from '@testing-library/react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

async function renderChannel(url: string, withChannel = true) {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      email: 'artist@tahti.live',
      username: 'artist',
      displayName: 'An Artist',
      role: 'ARTIST',
      isBoard: false,
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
    validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
      tab: typeof search.tab === 'string' ? search.tab : undefined,
    }),
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

describe('StudioChannelView section tabs', () => {
  it('writes the clicked tab to the URL', async () => {
    const { router } = await renderChannel('/studio/channel?tab=green-room');

    await clickTab('Selects');
    expect(router.state.location.search).toEqual({ tab: 'selects' });

    await clickTab('Green room');
    expect(router.state.location.search).toEqual({ tab: 'green-room' });
  });

  it('writes tab=setup from the Setup tab while there is no channel', async () => {
    const { router } = await renderChannel(
      '/studio/channel?tab=green-room',
      false,
    );

    await clickTab('Setup');
    expect(router.state.location.search).toEqual({ tab: 'setup' });

    await clickTab('Selects');
    expect(router.state.location.search).toEqual({ tab: 'selects' });
  });

  it('hides the Setup tab once the channel exists', async () => {
    await renderChannel('/studio/channel?tab=green-room');

    expect(screen.queryByRole('tab', { name: 'Setup' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Green room' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Selects' })).toBeInTheDocument();
  });
});
