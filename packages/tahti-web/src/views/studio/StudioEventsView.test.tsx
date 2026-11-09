import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../../stores/authStore';
import { StudioEventsView } from './StudioEventsView';

vi.mock('../../api/events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/events')>()),
  fetchMyEvents: async () => ({ data: [], meta: { source: 'api' as const } }),
}));

vi.mock('../../api/event-calendar', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/event-calendar')>()),
  fetchEventInvites: async () => ({
    data: [
      {
        event: {
          id: 'inv-1',
          title: 'Harbour night',
          description: '',
          place: 'Kaiku',
          location: 'Helsinki',
          eventUrl: null,
          ticketUrl: null,
          imageUrl: null,
          startAt: '2030-01-01T18:00:00.000Z',
          endAt: null,
          status: 'PUBLISHED' as const,
          publishedAt: null,
          participants: [],
        },
        host: { username: 'kaiku', displayName: 'Kaiku', channelSlug: null },
        role: 'PERFORMER' as const,
        status: 'PENDING' as const,
      },
    ],
    meta: { source: 'api' as const },
  }),
}));

beforeEach(() => {
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
  });
});

afterEach(() => {
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

async function renderAt(path: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const listRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/events',
    component: StudioEventsView,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([listRoute]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

describe('StudioEventsView tabs', () => {
  it('opens the Invites tab from a tag notification link', async () => {
    await renderAt('/studio/events?tab=invites');
    expect(await screen.findByText('Harbour night')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Invites/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('keeps the chosen tab in the address', async () => {
    const router = await renderAt('/studio/events');
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Past/ }));
    });
    expect(router.state.location.search).toEqual({ tab: 'past' });
  });
});
