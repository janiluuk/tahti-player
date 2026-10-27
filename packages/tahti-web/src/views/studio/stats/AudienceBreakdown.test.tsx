// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as extras from '../../../api/studio-extras';
import { AudienceBreakdown } from './AudienceBreakdown';

const share = (
  dimension: extras.StatsAudienceDimension,
  items: [string, number][],
) => {
  const total = items.reduce((sum, [, count]) => sum + count, 0);
  return {
    data: {
      dimension,
      total,
      minBucket: 5,
      items: items.map(([name, count]) => ({
        name,
        count,
        share: count / total,
      })),
    },
    meta: { source: 'api' as const },
  };
};

describe('AudienceBreakdown', () => {
  let fetchAudience: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchAudience = vi
      .spyOn(extras, 'fetchStatsAudience')
      .mockImplementation(async (dimension) =>
        share(
          dimension,
          dimension === 'deviceType'
            ? [
                ['Smartphone', 3],
                ['Desktop', 1],
              ]
            : [['Chrome', 4]],
        ),
      );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists every dimension for the window, leaving bots out', async () => {
    await act(async () => {
      render(<AudienceBreakdown window={{ range: '7' }} />);
    });
    const panel = screen.getByTestId('stats-audience');
    for (const title of [
      'Browser',
      'OS versions',
      'Device type',
      'Device company',
      'Source',
      'Listened on',
    ]) {
      expect(within(panel).getByRole('heading', { name: title })).toBeTruthy();
    }
    expect(within(panel).getByText('75 %')).toBeTruthy();
    expect(fetchAudience).toHaveBeenCalledWith('deviceType', {
      range: '7',
      from: undefined,
      to: undefined,
      soundId: undefined,
      includeBots: false,
    });
  });

  it('names listening surfaces in plain words', async () => {
    fetchAudience.mockImplementation(async (dimension) =>
      share(
        dimension,
        dimension === 'surface'
          ? [
              ['TAHTI_RADIO', 3],
              ['EMBED', 1],
            ]
          : [['Chrome', 4]],
      ),
    );
    await act(async () => {
      render(<AudienceBreakdown window={{ range: '7' }} />);
    });
    expect(screen.getByText('Tahti Radio')).toBeTruthy();
    expect(screen.getByText('Embeds')).toBeTruthy();
    expect(screen.queryByText('TAHTI_RADIO')).toBeNull();
  });

  it('asks again with bots once the toggle is off', async () => {
    await act(async () => {
      render(<AudienceBreakdown window={{ range: '30' }} />);
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('switch', { name: 'Ignore bot traffic' }),
      );
    });
    expect(fetchAudience).toHaveBeenLastCalledWith(
      'surface',
      expect.objectContaining({ includeBots: true }),
    );
  });

  it('shows a retry when the API fails', async () => {
    fetchAudience.mockResolvedValue({
      data: { dimension: 'browser', total: 0, minBucket: 5, items: [] },
      meta: { source: 'api', reason: '500' },
    });
    await act(async () => {
      render(<AudienceBreakdown window={{ range: '30' }} />);
    });
    expect(
      screen.getByText('Could not load the audience breakdown'),
    ).toBeTruthy();
  });
});
