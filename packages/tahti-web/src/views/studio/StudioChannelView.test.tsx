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
  channelRadioRedirect,
  channelTabRedirect,
  isChannelRadioTab,
} from '../../lib/channelSections';
import { useAuthStore } from '../../stores/authStore';
import { StudioChannelView } from './StudioChannelView';

vi.mock('../../components/PinnedAnnouncementsPanel', () => ({
  PinnedAnnouncementsPanel: () => null,
}));
vi.mock('../../components/StreamManagerPanel', () => ({
  StreamManagerPanel: () => null,
}));
vi.mock('../../components/StudioRadioSubmissionPanel', () => ({
  StudioRadioSubmissionPanel: () => null,
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
  const scheduleRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/schedule',
    validateSearch: (search: Record<string, unknown>) => ({
      ...(typeof search.tab === 'string' ? { tab: search.tab } : {}),
    }),
    component: () => <div data-testid="schedule-stub" />,
  });
  const goLiveRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/go-live',
    validateSearch: (search: Record<string, unknown>) => ({
      ...(typeof search.step === 'string' ? { step: search.step } : {}),
    }),
    component: () => <div data-testid="go-live-stub" />,
  });
  const channelRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/channel',
    validateSearch: (
      search: Record<string, unknown>,
    ): { tab?: string; radio?: string } => ({
      ...(typeof search.tab === 'string' ? { tab: search.tab } : {}),
      ...(typeof search.radio === 'string' ? { radio: search.radio } : {}),
    }),
    beforeLoad: ({ search }) => {
      const fromTab = channelTabRedirect(search.tab);
      if (fromTab) {
        throw redirect(fromTab as never);
      }
      const fromRadio = channelRadioRedirect(search.radio);
      if (fromRadio) {
        throw redirect(fromRadio as never);
      }
      if (search.radio && !isChannelRadioTab(search.radio)) {
        throw redirect({ to: '/studio/channel', search: {}, replace: true });
      }
    },
    component: StudioChannelView,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      channelRoute,
      scheduleRoute,
      goLiveRoute,
    ]),
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

describe('StudioChannelView sections', () => {
  it('shows Radio as Stream · Pinned · Multicast with home links', async () => {
    await renderChannel('/studio/channel');

    expect(
      Array.from(document.querySelectorAll('section[id]')).map((s) => s.id),
    ).toEqual(['radio']);
    expect(screen.getByRole('heading', { name: 'Radio' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Stream' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Pinned' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Multicast' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '24/7' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Green room' })).toBeNull();
  });

  it('keeps Tahti Selects out of Studio, even for the board', async () => {
    await renderChannel('/studio/channel', true, true);
    expect(screen.queryByRole('tab', { name: 'Tahti Selects' })).toBeNull();
  });

  it.each([
    ['design', '/studio/profile/$section'],
    ['profile', '/studio/profile/$section'],
    ['selects', '/admin/tahti-selects'],
    ['rotation', '/studio/schedule'],
    ['green-room', '/studio/go-live'],
  ])('sends the old ?tab=%s to %s', (tab, path) => {
    const target = channelTabRedirect(tab);
    expect(target).not.toBeNull();
    expect(target!.to).toBe(path);
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
    ['/studio/channel?tab=radio', '/studio/channel', {}, 'radio'],
    [
      '/studio/channel?tab=pinned',
      '/studio/channel',
      { radio: 'pinned' },
      'radio',
    ],
    [
      '/studio/channel?tab=multicast',
      '/studio/channel',
      { radio: 'multicast' },
      'radio',
    ],
    [
      '/studio/channel?tab=rotation',
      '/studio/schedule',
      { tab: 'programme' },
      '',
    ],
    [
      '/studio/channel?radio=rotation',
      '/studio/schedule',
      { tab: 'programme' },
      '',
    ],
    [
      '/studio/channel?tab=green-room',
      '/studio/go-live',
      { step: 'green-room' },
      '',
    ],
  ])('redirects %s', async (url, path, search, hash) => {
    const { router } = await renderChannel(url);
    expect(router.state.location.pathname).toBe(path);
    expect(router.state.location.search).toEqual(search);
    expect(router.state.location.hash).toBe(hash);
  });
});
