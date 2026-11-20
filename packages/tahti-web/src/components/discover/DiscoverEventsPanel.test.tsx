// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import {
  fetchUpcomingEvents,
  type UpcomingEvent,
} from '../../api/upcoming-events';
import { useAuthModalStore } from '../../stores/authModalStore';
import { useAuthStore } from '../../stores/authStore';
import { renderWithRouter } from '../../test/renderWithRouter';
import { DiscoverEventsPanel } from './DiscoverEventsPanel';

vi.mock('../../api/upcoming-events', () => ({
  fetchUpcomingEvents: vi.fn(),
}));

const withBanner: UpcomingEvent = {
  id: 'evt-a',
  title: 'Rooftop closing set',
  description: null,
  place: 'Typed place',
  location: 'Typed city',
  eventUrl: null,
  startAt: '2030-06-21T17:00:00.000Z',
  timezone: 'Europe/Helsinki',
  imageUrl: 'https://media.example/banner.jpg',
  venue: { id: 'v1', slug: 'kaiku', name: 'Kaiku', city: 'Helsinki' },
  artistDisplayName: 'Northern Lights',
  artistUsername: 'northern-lights',
  channelSlug: 'northern-lights',
  avatarUrl: null,
};

const withoutBanner: UpcomingEvent = {
  ...withBanner,
  id: 'evt-b',
  title: 'Garage jam',
  imageUrl: null,
  venue: null,
  place: 'Garage',
  location: 'Tampere',
};

function serve(items: UpcomingEvent[], reason?: string) {
  vi.mocked(fetchUpcomingEvents).mockResolvedValue({
    data: items,
    meta: reason ? { source: 'api', reason } : { source: 'api' },
  });
}

function signIn() {
  useAuthStore.setState({
    user: {
      id: 'u1',
      email: 'listener@tahti.live',
      username: 'listener',
      displayName: 'Listener',
      role: 'LISTENER',
      isBoard: false,
      isMember: false,
    },
    hydrated: true,
  });
}

const renderPanel = () =>
  renderWithRouter(
    <MediaArtworkDefaultProvider value={(seed) => `/artwork/${seed}.webp`}>
      <DiscoverEventsPanel />
    </MediaArtworkDefaultProvider>,
    { paths: ['/events/$eventId', '/events/new'] },
  );

describe('DiscoverEventsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null });
    useAuthModalStore.setState({ isOpen: false });
  });

  it('lists upcoming events with banner, venue and a link to the event page', async () => {
    serve([withBanner, withoutBanner]);
    const { container } = await renderPanel();
    expect(await screen.findByText('Rooftop closing set')).toBeTruthy();
    expect(fetchUpcomingEvents).toHaveBeenCalledWith(50);
    expect(
      screen.getByRole('link', { name: 'Rooftop closing set' }),
    ).toHaveAttribute('href', '/events/evt-a');
    expect(screen.getByText('Kaiku, Helsinki')).toBeTruthy();
    expect(screen.getByText('Garage, Tampere')).toBeTruthy();
    const images = [...container.querySelectorAll('img')].map((img) =>
      img.getAttribute('src'),
    );
    expect(images).toEqual([
      'https://media.example/banner.jpg',
      '/artwork/evt-b.webp',
    ]);
  });

  it('shows the empty state when nothing is coming up', async () => {
    serve([]);
    await renderPanel();
    expect(await screen.findByText('No upcoming events')).toBeTruthy();
  });

  it('shows the error and retries', async () => {
    serve([], 'HTTP 503');
    await renderPanel();
    expect(await screen.findByText('Could not load events')).toBeTruthy();
    serve([withBanner]);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(await screen.findByText('Rooftop closing set')).toBeTruthy();
    expect(fetchUpcomingEvents).toHaveBeenCalledTimes(2);
  });

  it('links Post event to the form when signed in', async () => {
    signIn();
    serve([]);
    await renderPanel();
    expect(screen.getByRole('link', { name: 'Post event' })).toHaveAttribute(
      'href',
      '/events/new',
    );
  });

  it('asks a signed-out visitor to sign in from Post event', async () => {
    serve([]);
    await renderPanel();
    expect(screen.queryByRole('link', { name: 'Post event' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Post event' }));
    expect(useAuthModalStore.getState().isOpen).toBe(true);
    expect(useAuthModalStore.getState().mode).toBe('login');
  });
});
