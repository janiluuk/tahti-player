import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as client from '../../api/client';
import * as venuesManage from '../../api/venues-manage';
import { RecordedAtVenuePicker, venueOptions } from './RecordedAtVenuePicker';

const venue = (id: string, name: string, city: string | null = null) => ({
  id,
  name,
  city,
});

describe('venueOptions', () => {
  it('merges verified and own venues by id, sorted by label', () => {
    expect(
      venueOptions(
        [
          [venue('v2', 'Kaiku', 'Helsinki'), venue('v1', 'Zetor')],
          [venue('v2', 'Kaiku', 'Helsinki'), venue('v3', 'Bar Loose')],
        ],
        null,
      ),
    ).toEqual([
      { id: 'v3', label: 'Bar Loose' },
      { id: 'v2', label: 'Kaiku · Helsinki' },
      { id: 'v1', label: 'Zetor' },
    ]);
  });

  it('keeps the current venue when no list returns it', () => {
    expect(
      venueOptions([[]], {
        id: 'v9',
        slug: 'old-club',
        name: 'Old Club',
        city: 'Turku',
        countryCode: 'FI',
      }),
    ).toEqual([{ id: 'v9', label: 'Old Club · Turku' }]);
  });
});

describe('RecordedAtVenuePicker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads verified and own venues and shows the selected one', async () => {
    const fetchVenues = vi.spyOn(client, 'fetchVenues').mockResolvedValue({
      data: [
        {
          id: 'v2',
          slug: 'kaiku',
          name: 'Kaiku',
          city: 'Helsinki',
          countryCode: 'FI',
          capacity: null,
          description: null,
        },
      ],
      meta: { source: 'api' },
    });
    const fetchMine = vi
      .spyOn(venuesManage, 'fetchMyVenues')
      .mockResolvedValue({ data: [], meta: { source: 'api' } });

    render(
      <RecordedAtVenuePicker value="v2" current={null} onChange={vi.fn()} />,
    );

    await waitFor(() => expect(fetchVenues).toHaveBeenCalled());
    expect(fetchMine).toHaveBeenCalled();
    expect(await screen.findByText('Kaiku · Helsinki')).toBeInTheDocument();
  });
});
