import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as recent from '../../../api/studio/studio-recent';
import { renderWithRouter } from '../../../test/renderWithRouter';
import { RecentActivitySection } from './RecentActivitySection';

describe('RecentActivitySection', () => {
  it('lists recent uploads and this month’s fan-sub income', async () => {
    vi.spyOn(recent, 'fetchRecentSounds').mockResolvedValue({
      data: [
        {
          id: 's1',
          title: 'Night Drive',
          durationSec: 125,
          createdAt: '2026-10-18T10:00:00.000Z',
        },
      ],
      meta: { source: 'api' },
    });
    vi.spyOn(recent, 'fetchFanPayoutSummary').mockResolvedValue({
      data: { thisMonthNetCents: 1240 },
      meta: { source: 'api' },
    });

    await renderWithRouter(<RecentActivitySection />);

    expect(
      await screen.findByRole('link', { name: 'Night Drive' }),
    ).toHaveAttribute('href', '/studio/sounds/s1');
    expect(screen.getByText(/2:05/)).toBeVisible();
    const income = screen.getByRole('link', { name: /Fan subscriptions/ });
    expect(income).toHaveAttribute('href', '/studio/revenue');
    expect(income.textContent).toMatch(/12[.,]40/);
  });

  it('renders nothing when both reads fail', async () => {
    vi.spyOn(recent, 'fetchRecentSounds').mockResolvedValue({
      data: [],
      meta: { source: 'api', reason: 'HTTP 500' },
    });
    vi.spyOn(recent, 'fetchFanPayoutSummary').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 500' },
    });

    const { container } = await renderWithRouter(<RecentActivitySection />);

    expect(container.textContent).not.toContain('Recent activity');
  });
});
