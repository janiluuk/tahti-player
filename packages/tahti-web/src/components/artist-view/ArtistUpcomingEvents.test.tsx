import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchChannelEvents } from '../../api/events';
import { ArtistUpcomingEvents } from './ArtistUpcomingEvents';

vi.mock('../../api/events', () => ({ fetchChannelEvents: vi.fn() }));

async function renderEvents(
  events: Awaited<ReturnType<typeof fetchChannelEvents>>['data'],
) {
  vi.mocked(fetchChannelEvents).mockResolvedValue({
    data: events,
    meta: { source: 'api' },
  });
  let result: ReturnType<typeof render> | undefined;
  await act(async () => {
    result = render(<ArtistUpcomingEvents channelSlug="night-drive" />);
  });
  return result!;
}

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
      },
      {
        id: 'e2',
        title: 'Listening session',
        description: '',
        place: 'Korundi',
        location: 'Rovaniemi',
        eventUrl: null,
        startAt: '2026-12-01T18:00:00.000Z',
      },
    ]);

    expect(fetchChannelEvents).toHaveBeenCalledWith('night-drive');
    expect(screen.getByRole('link', { name: /Release show/ })).toHaveAttribute(
      'href',
      'https://example.com/show',
    );
    expect(screen.getByText('Listening session')).toBeInTheDocument();
    expect(screen.getByText('Korundi, Rovaniemi')).toBeInTheDocument();
  });

  it('renders nothing when there are no upcoming events', async () => {
    const { container } = await renderEvents([]);
    expect(container).toBeEmptyDOMElement();
  });
});
