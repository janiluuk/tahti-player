// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ArtistEvent } from '../../api/events';
import { useAuthStore } from '../../stores/authStore';
import { StudioEventView } from './StudioEventView';

const existing: ArtistEvent = {
  id: 'evt-1',
  title: 'Release show',
  description: 'Doors 18:00',
  place: 'Kaiku',
  location: 'Helsinki',
  eventUrl: 'https://tickets.example.com/show',
  startAt: '2026-11-01T18:00:00.000Z',
};

vi.mock('../../api/events', () => ({
  fetchMyEvents: async () => ({
    data: [existing],
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

async function renderView(eventId: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const viewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/events/$eventId',
    component: () => <StudioEventView eventId={eventId} />,
  });
  const editRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/events/$eventId/edit',
    component: () => <div>Event form</div>,
  });
  const listRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/events',
    component: () => <div>Events list</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([viewRoute, editRoute, listRoute]),
    history: createMemoryHistory({
      initialEntries: [`/studio/events/${eventId}`],
    }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

describe('StudioEventView', () => {
  it('shows the event read-only and the pencil opens the form', async () => {
    const router = await renderView('evt-1');

    expect(
      await screen.findByRole('heading', { name: 'Release show' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Kaiku, Helsinki')).toBeInTheDocument();
    expect(screen.getByText('Doors 18:00')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('link', { name: 'Edit Release show' }),
    );
    expect(router.state.location.pathname).toBe('/studio/events/evt-1/edit');
    expect(await screen.findByText('Event form')).toBeInTheDocument();
  });

  it('says so when the event is not one of yours', async () => {
    await renderView('missing');
    expect(
      await screen.findByText('That event could not be found'),
    ).toBeInTheDocument();
  });
});
