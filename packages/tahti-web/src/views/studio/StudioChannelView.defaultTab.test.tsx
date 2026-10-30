// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act } from '@testing-library/react';
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

async function renderChannel(url: string) {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      email: 'artist@tahti.live',
      username: 'artist',
      displayName: 'An Artist',
      role: 'ARTIST',
      isBoard: false,
      isMember: true,
      channel: { slug: 'artist', state: 'OFFLINE' },
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
  const history = createMemoryHistory({ initialEntries: [url] });
  const router = createRouter({
    routeTree: rootRoute.addChildren([channelRoute]),
    history,
  });
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return { router, history };
}

describe('StudioChannelView default tab', () => {
  it('opens Green room when the artist already has a channel', async () => {
    const { router, history } = await renderChannel('/studio/channel');

    expect(router.state.location.search).toEqual({ tab: 'green-room' });
    expect(history.length).toBe(1);
    expect(document.body.textContent?.includes('Open Green Room chat')).toBe(
      true,
    );
  });

  it('keeps an explicit tab', async () => {
    const { router } = await renderChannel('/studio/channel?tab=green-room');

    expect(router.state.location.search).toEqual({ tab: 'green-room' });
  });
});
