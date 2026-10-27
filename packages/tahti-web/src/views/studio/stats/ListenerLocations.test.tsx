// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as extras from '../../../api/studio-extras';
import { ListenerLocations } from './ListenerLocations';

describe('ListenerLocations', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists countries by name and the cities enough listeners share', async () => {
    const fetchLocations = vi
      .spyOn(extras, 'fetchStatsLocations')
      .mockResolvedValue({
        data: {
          total: 20,
          minBucket: 5,
          countries: [
            { name: 'FI', countryCode: 'FI', count: 14, share: 0.7 },
            { name: 'Other', countryCode: null, count: 6, share: 0.3 },
          ],
          cities: [
            { name: 'Helsinki', countryCode: 'FI', count: 12, share: 0.6 },
          ],
        },
        meta: { source: 'api' },
      });
    await act(async () => {
      render(<ListenerLocations window={{ range: '30' }} />);
    });
    const lists = screen.getByTestId('stats-locations');
    expect(within(lists).getByText('Finland')).toBeTruthy();
    expect(within(lists).getByText('Other')).toBeTruthy();
    expect(within(lists).getByText('Helsinki')).toBeTruthy();
    expect(within(lists).getByText('60 %')).toBeTruthy();
    expect(fetchLocations).toHaveBeenCalledWith({
      range: '30',
      from: undefined,
      to: undefined,
      soundId: undefined,
    });
  });

  it('explains the city threshold while no city qualifies', async () => {
    vi.spyOn(extras, 'fetchStatsLocations').mockResolvedValue({
      data: { total: 3, minBucket: 5, countries: [], cities: [] },
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<ListenerLocations window={{ range: '7' }} />);
    });
    expect(
      screen.getByText('Cities show once at least 5 listens share one.'),
    ).toBeTruthy();
  });
});
