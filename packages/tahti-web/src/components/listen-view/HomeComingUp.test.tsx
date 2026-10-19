import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as upcoming from '../../api/upcoming-events';
import { renderWithRouter } from '../../test/renderWithRouter';
import { HomeComingUp } from './HomeComingUp';

const event = {
  id: 'e1',
  title: 'Album release show',
  description: null,
  place: 'Kuudes Linja',
  location: 'Helsinki',
  eventUrl: null,
  startAt: '2030-05-04T18:00:00.000Z',
  artistDisplayName: 'Night Owls',
  artistUsername: 'night-owls',
  channelSlug: 'night-owls',
  avatarUrl: null,
};

describe('HomeComingUp', () => {
  it('lists upcoming shows and opens the artist channel', async () => {
    vi.spyOn(upcoming, 'fetchUpcomingEvents').mockResolvedValue({
      data: [event],
      meta: { source: 'api' },
    });

    const { router } = await renderWithRouter(<HomeComingUp />, {
      paths: ['/channel/$slug'],
    });

    expect(await screen.findByText('Album release show')).toBeVisible();
    expect(
      screen.getByText('Night Owls · Kuudes Linja, Helsinki'),
    ).toBeVisible();
    fireEvent.click(screen.getByText('Album release show'));
    expect(router.state.location.pathname).toBe('/channel/night-owls');
  });

  it('renders nothing when no events are coming up', async () => {
    vi.spyOn(upcoming, 'fetchUpcomingEvents').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 404' },
    });

    await renderWithRouter(<HomeComingUp />);

    expect(screen.queryByTestId('listen-coming-up')).toBeNull();
  });
});
