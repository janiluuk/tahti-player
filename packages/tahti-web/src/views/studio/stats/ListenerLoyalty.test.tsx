// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as extras from '../../../api/studio-extras';
import { ListenerLoyalty } from './ListenerLoyalty';

vi.mock('@tahti-player/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tahti-player/ui')>()),
  DayOfWeekChart: ({ labels }: { labels: { weekdays: string[] } }) => (
    <div data-testid="loyalty-chart">{labels.weekdays.join(',')}</div>
  ),
}));

describe('ListenerLoyalty', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('sums up halfway and end shares and charts every tenth', async () => {
    vi.spyOn(extras, 'fetchStatsLoyalty').mockResolvedValue({
      data: {
        total: 40,
        minBucket: 5,
        points: Array.from({ length: 11 }, (_, i) => ({
          percent: i * 10,
          share: 1 - i * 0.07,
        })),
      },
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<ListenerLoyalty window={{ range: '30', soundId: 's1' }} />);
    });
    expect(
      screen.getByText(/65 % got halfway · 30 % listened to the end/),
    ).toBeTruthy();
    expect(screen.getByTestId('loyalty-chart').textContent).toBe(
      '0%,10%,20%,30%,40%,50%,60%,70%,80%,90%,100%',
    );
  });

  it('waits for enough listens before drawing a curve', async () => {
    vi.spyOn(extras, 'fetchStatsLoyalty').mockResolvedValue({
      data: { total: 2, minBucket: 5, points: [] },
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<ListenerLoyalty window={{ range: '30' }} />);
    });
    expect(screen.getByText(/once at least 5 listens/)).toBeTruthy();
    expect(screen.queryByTestId('loyalty-chart')).toBeNull();
  });
});
