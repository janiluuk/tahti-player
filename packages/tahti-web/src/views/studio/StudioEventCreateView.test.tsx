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

import type { ArtistEvent } from '../../api/events';
import { toDatetimeLocalValue } from '../../lib/datetimeLocal';
import { useAuthStore } from '../../stores/authStore';
import { StudioEventCreateView } from './StudioEventCreateView';

const existing: ArtistEvent = {
  id: 'evt-1',
  title: 'Release show',
  description: 'Doors 18:00',
  place: 'Kaiku',
  location: 'Helsinki',
  eventUrl: 'https://tickets.example.com/old',
  startAt: '2026-11-01T18:00:00.000Z',
};

const createEvent = vi.fn();
const updateEvent = vi.fn();

vi.mock('../../api/events', () => ({
  fetchMyEvents: async () => ({
    data: [existing],
    meta: { source: 'api' as const },
  }),
  createEvent: (...args: unknown[]) => createEvent(...args),
  updateEvent: (...args: unknown[]) => updateEvent(...args),
}));

vi.mock('../../api/client', () => ({
  fetchVenues: async () => ({ data: [], meta: { source: 'api' as const } }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  updateEvent.mockResolvedValue({ ok: true, data: existing });
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

async function renderEdit(eventId: string) {
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
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const editRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/events/$eventId/edit',
    component: () => <StudioEventCreateView eventId={eventId} />,
  });
  const listRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/events',
    component: () => <div>Events list</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([editRoute, listRoute]),
    history: createMemoryHistory({
      initialEntries: [`/studio/events/${eventId}/edit`],
    }),
  });
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('StudioEventCreateView editing', () => {
  it('prefills the form and saves changes with PATCH, not a new event', async () => {
    await renderEdit('evt-1');

    expect(screen.getByText('Edit event')).toBeInTheDocument();
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'Release show',
    );
    expect((screen.getByLabelText('Start') as HTMLInputElement).value).toBe(
      toDatetimeLocalValue(existing.startAt),
    );

    const link = screen.getByLabelText(
      'Tickets / event link (optional)',
    ) as HTMLInputElement;
    expect(link.value).toBe('https://tickets.example.com/old');
    await act(async () => fireEvent.change(link, { target: { value: '' } }));
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' })),
    );

    expect(createEvent).not.toHaveBeenCalled();
    expect(updateEvent).toHaveBeenCalledWith('evt-1', {
      title: 'Release show',
      description: 'Doors 18:00',
      place: 'Kaiku',
      location: 'Helsinki',
      startAt: existing.startAt,
      eventUrl: '',
    });
    expect(await screen.findByText('Events list')).toBeInTheDocument();
  });

  it('goes back to the list when the event is not the artist’s', async () => {
    await renderEdit('someone-elses');
    expect(await screen.findByText('Events list')).toBeInTheDocument();
  });
});
