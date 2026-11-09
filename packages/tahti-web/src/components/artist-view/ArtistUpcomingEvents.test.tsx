import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchChannelEvents } from '../../api/events';
import { renderWithRouter } from '../../test/renderWithRouter';
import { ArtistUpcomingEvents } from './ArtistUpcomingEvents';

vi.mock('../../api/events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/events')>()),
  fetchChannelEvents: vi.fn(),
}));

async function renderEvents(
  events: Awaited<ReturnType<typeof fetchChannelEvents>>['data'],
) {
  vi.mocked(fetchChannelEvents).mockResolvedValue({
    data: events,
    meta: { source: 'api' },
  });
  return renderWithRouter(
    <ArtistUpcomingEvents channelSlug="night-drive" username="night" />,
  );
}

const extra = {
  ticketUrl: null,
  imageUrl: null,
  endAt: null,
  status: 'PUBLISHED' as const,
  publishedAt: null,
  participants: [],
};

describe('ArtistUpcomingEvents', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lists the channel's upcoming events with their venue", async () => {
    await renderEvents([
      {
        id: 'e1',
        title: 'Release show',
        description: '',
        place: 'Kuudes Linja',
        location: 'Helsinki',
        eventUrl: 'https://example.com/show',
        startAt: '2026-11-01T18:00:00.000Z',
        ...extra,
        status: 'CANCELLED',
        participants: [
          {
            username: 'aurora',
            displayName: 'Aurora Drift',
            avatarUrl: null,
            channelSlug: null,
            role: 'PERFORMER',
            status: 'ACCEPTED',
          },
        ],
      },
      {
        id: 'e2',
        title: 'Listening session',
        description: '',
        place: 'Korundi',
        location: 'Rovaniemi',
        eventUrl: null,
        startAt: '2026-12-01T18:00:00.000Z',
        ...extra,
      },
    ]);

    expect(fetchChannelEvents).toHaveBeenCalledWith('night-drive');
    expect(
      screen.getByRole('link', { name: 'Listening session' }),
    ).toHaveAttribute('href', '/events/e2');
    expect(screen.getByText('Korundi, Rovaniemi')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('Aurora Drift')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Subscribe/ }).getAttribute('href'),
    ).toContain('/api/v1/u/night/events.ics');
  });

  it('renders nothing when there are no upcoming events', async () => {
    const { container } = await renderEvents([]);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an error instead of hiding when events fail to load', async () => {
    vi.mocked(fetchChannelEvents).mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    await act(async () => {
      render(<ArtistUpcomingEvents channelSlug="night-drive" />);
    });
    expect(screen.getByText('Could not load upcoming events')).toBeTruthy();
    expect(screen.getByText('HTTP 502')).toBeTruthy();
  });
});
