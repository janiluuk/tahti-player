import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as venuesManage from '../../api/venues-manage';
import { VenueDetailsForm } from './VenueDetailsForm';

const venue: venuesManage.MyVenue = {
  id: 'v1',
  slug: 'kuudes-linja',
  name: 'Kuudes Linja',
  address: 'Hämeentie 13',
  city: 'Helsinki',
  countryCode: 'FI',
  description: null,
  capacity: 300,
  latitude: null,
  longitude: null,
  externalLinks: null,
  photos: [],
  verifiedAt: null,
  broadcasts: [],
};

describe('VenueDetailsForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves the edited details', async () => {
    const patch = vi
      .spyOn(venuesManage, 'patchVenue')
      .mockResolvedValue({ ok: true, data: venue });
    const onSaved = vi.fn();
    render(
      <VenueDetailsForm venue={venue} onSaved={onSaved} onCancel={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText('Capacity'), {
      target: { value: '350' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: '  Basement club  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    expect(patch).toHaveBeenCalledWith('kuudes-linja', {
      name: 'Kuudes Linja',
      address: 'Hämeentie 13',
      city: 'Helsinki',
      capacity: 350,
      description: 'Basement club',
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(venue));
  });

  it('refuses a capacity that is not a whole number', () => {
    const patch = vi.spyOn(venuesManage, 'patchVenue');
    render(
      <VenueDetailsForm venue={venue} onSaved={vi.fn()} onCancel={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText('Capacity'), {
      target: { value: '12.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Capacity must be a whole number of people.',
    );
    expect(patch).not.toHaveBeenCalled();
  });

  it("shows the API's error", async () => {
    vi.spyOn(venuesManage, 'patchVenue').mockResolvedValue({
      ok: false,
      error: 'Forbidden',
    });
    render(
      <VenueDetailsForm venue={venue} onSaved={vi.fn()} onCancel={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden');
  });
});
