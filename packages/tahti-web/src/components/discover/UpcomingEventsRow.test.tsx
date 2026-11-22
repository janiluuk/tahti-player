// @vitest-environment jsdom
import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MediaArtworkDefaultProvider } from '@tahti-player/ui';

import * as upcoming from '../../api/upcoming-events';
import type { UpcomingEvent } from '../../api/upcoming-events';
import { clearSnapshots } from '../../lib/useSnapshotFetch';
import { renderWithRouter } from '../../test/renderWithRouter';
import { DiscoverNextEvents, UpcomingEventsStrip } from './UpcomingEventsRow';
import { WidgetCard } from './WidgetCard';

function event(
  id: string,
  title: string,
  patch: Partial<UpcomingEvent> = {},
): UpcomingEvent {
  return {
    id,
    title,
    description: null,
    place: 'Kuudes Linja',
    location: 'Helsinki',
    eventUrl: null,
    startAt: '2030-05-04T18:00:00.000Z',
    gallery: [],
    artistDisplayName: 'Night Owls',
    artistUsername: 'night-owls',
    channelSlug: 'night-owls',
    avatarUrl: null,
    ...patch,
  };
}

const withBanner = event('evt-1', 'Album release show', {
  imageUrl: 'https://media.example/banner.jpg',
});
const noBanner = event('evt-2', 'Boathouse session', {
  place: 'Boathouse',
  location: 'Lappeenranta',
  venue: { id: 'v1', slug: 'kaiku', name: 'Kaiku', city: 'Helsinki' },
});

function withDefaultArtwork(ui: React.ReactNode) {
  return (
    <MediaArtworkDefaultProvider value={(seed) => `/artwork/${seed}.webp`}>
      {ui}
    </MediaArtworkDefaultProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  clearSnapshots();
});

describe('UpcomingEventsStrip', () => {
  it('shows each event as a card with title, place and the default artwork when there is no banner', async () => {
    const { container, router } = await renderWithRouter(
      withDefaultArtwork(
        <UpcomingEventsStrip events={[withBanner, noBanner]} />,
      ),
      { paths: ['/events/$eventId', '/discover'] },
    );

    const row = screen.getByTestId('upcoming-events');
    expect(within(row).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Album release show')).toBeVisible();
    expect(screen.getByText('Kuudes Linja, Helsinki')).toBeVisible();
    expect(screen.getByText('Kaiku, Helsinki')).toBeVisible();
    const images = [...container.querySelectorAll('img')].map((img) =>
      img.getAttribute('src'),
    );
    expect(images).toEqual([
      'https://media.example/banner.jpg',
      '/artwork/evt-2.webp',
    ]);
    expect(
      screen.getByRole('link', { name: 'See all events' }),
    ).toHaveAttribute('href', '/discover?tab=events');

    fireEvent.click(screen.getByText('Boathouse session'));
    expect(router.state.location.pathname).toBe('/events/evt-2');
  });

  it('is the body of the upcoming-events Discover widget', async () => {
    await renderWithRouter(
      withDefaultArtwork(
        <WidgetCard
          id="upcoming-events"
          title="Upcoming events"
          loading={false}
          items={[]}
          events={[withBanner]}
          emptyMessage="No upcoming events yet."
          canMoveUp={false}
          canMoveDown={false}
          onMove={() => {}}
          onRemove={() => {}}
        />,
      ),
      { paths: ['/events/$eventId', '/discover'] },
    );

    expect(
      screen.getByRole('heading', { name: 'Upcoming events' }),
    ).toBeVisible();
    expect(screen.getByTestId('upcoming-events')).toHaveTextContent(
      'Album release show',
    );
    expect(screen.queryByText('No upcoming events yet.')).toBeNull();
  });
});

describe('DiscoverNextEvents', () => {
  it('lists the next events soonest first under Next events', async () => {
    const fetchEvents = vi
      .spyOn(upcoming, 'fetchUpcomingEvents')
      .mockResolvedValue({
        data: [withBanner, noBanner],
        meta: { source: 'api' },
      });

    await renderWithRouter(withDefaultArtwork(<DiscoverNextEvents />), {
      paths: ['/events/$eventId'],
    });

    const row = await screen.findByTestId('discover-next-events');
    expect(within(row).getByText('Next events')).toBeVisible();
    const titles = within(row)
      .getAllByTestId('event-card-title')
      .map((node) => node.textContent);
    expect(titles).toEqual(['Album release show', 'Boathouse session']);
    expect(fetchEvents).toHaveBeenCalledWith(12);
  });

  it('renders nothing when no events are coming up', async () => {
    vi.spyOn(upcoming, 'fetchUpcomingEvents').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });

    await renderWithRouter(<DiscoverNextEvents />);

    expect(screen.queryByTestId('discover-next-events')).toBeNull();
  });
});
