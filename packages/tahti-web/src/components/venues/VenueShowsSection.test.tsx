import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as restrictions from '../../api/me-restrictions';
import * as venuesManage from '../../api/venues-manage';
import { VenueShowsSection } from './VenueShowsSection';

const venue: venuesManage.MyVenue = {
  id: 'v1',
  slug: 'kuudes-linja',
  name: 'Kuudes Linja',
  address: 'Hämeentie 13',
  city: 'Helsinki',
  countryCode: 'FI',
  description: null,
  capacity: null,
  latitude: null,
  longitude: null,
  externalLinks: null,
  photos: [],
  verifiedAt: null,
  broadcasts: [
    {
      id: 's1',
      startAt: '2026-11-01T18:00:00.000Z',
      endAt: null,
      description: 'Album release',
      channelId: null,
      state: 'SCHEDULED',
    },
    {
      id: 's2',
      startAt: '2026-10-17T18:00:00.000Z',
      endAt: null,
      description: 'On now',
      channelId: null,
      state: 'LIVE',
    },
    {
      id: 's3',
      startAt: '2026-11-02T18:00:00.000Z',
      endAt: null,
      description: 'Called off',
      channelId: null,
      state: 'CANCELED',
    },
  ],
};

describe('VenueShowsSection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists scheduled and live shows, not cancelled ones', () => {
    render(<VenueShowsSection venue={venue} onChanged={vi.fn()} />);
    expect(screen.getByText('Album release')).toBeInTheDocument();
    expect(screen.getByText(/Live now/)).toBeInTheDocument();
    expect(screen.queryByText('Called off')).toBeNull();
  });

  it('books a show and reloads', async () => {
    const create = vi
      .spyOn(venuesManage, 'createVenueBroadcast')
      .mockResolvedValue({ ok: true, data: venue.broadcasts[0]! });
    const onChanged = vi.fn();
    render(
      <VenueShowsSection
        venue={{ ...venue, broadcasts: [] }}
        onChanged={onChanged}
      />,
    );
    expect(screen.getByText('No shows booked here yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Book a show' }));
    fireEvent.change(screen.getByLabelText('Starts'), {
      target: { value: '2026-11-20T19:00' },
    });
    fireEvent.change(screen.getByLabelText('Ends (optional)'), {
      target: { value: '2026-11-20T22:00' },
    });
    fireEvent.change(screen.getByLabelText('What is on (optional)'), {
      target: { value: ' Club night ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Book the show' }));
    expect(create).toHaveBeenCalledWith('kuudes-linja', {
      startAt: new Date('2026-11-20T19:00').toISOString(),
      endAt: new Date('2026-11-20T22:00').toISOString(),
      description: 'Club night',
    });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('says so when the board has blocked bookings', async () => {
    vi.spyOn(restrictions, 'fetchMyRestrictions').mockResolvedValue([
      { type: 'LIVE_SHOW_BOOKING', reason: 'No-shows', expiresAt: null },
    ]);
    render(<VenueShowsSection venue={venue} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Book a show' }));
    expect(await screen.findByText('Booking shows is blocked')).toBeTruthy();
    expect(screen.getByText('Reason: No-shows')).toBeTruthy();
  });

  it('refuses a show without a start or ending before it starts', () => {
    const create = vi.spyOn(venuesManage, 'createVenueBroadcast');
    render(<VenueShowsSection venue={venue} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Book a show' }));
    fireEvent.click(screen.getByRole('button', { name: 'Book the show' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose when the show starts.',
    );
    fireEvent.change(screen.getByLabelText('Starts'), {
      target: { value: '2026-11-20T19:00' },
    });
    fireEvent.change(screen.getByLabelText('Ends (optional)'), {
      target: { value: '2026-11-20T18:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Book the show' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The show must end after it starts.',
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('cancels a scheduled show after confirming', async () => {
    const cancel = vi
      .spyOn(venuesManage, 'cancelVenueBroadcast')
      .mockResolvedValue({ ok: true });
    const onChanged = vi.fn();
    render(<VenueShowsSection venue={venue} onChanged={onChanged} />);
    expect(
      screen.getAllByRole('button', { name: /^Cancel show on/ }),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /^Cancel show on/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel show' }));
    expect(cancel).toHaveBeenCalledWith('kuudes-linja', 's1');
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it('shows why a show could not be cancelled', async () => {
    vi.spyOn(venuesManage, 'cancelVenueBroadcast').mockResolvedValue({
      ok: false,
      error: 'Forbidden',
    });
    render(<VenueShowsSection venue={venue} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /^Cancel show on/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel show' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden');
  });
});
