// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import { AdminUserEngagementPanel } from './AdminUserEngagementPanel';

describe('AdminUserEngagementPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the year total and the board adjustments behind it', async () => {
    const fetch = vi
      .spyOn(admin, 'fetchAdminUserEngagement')
      .mockResolvedValue({
        data: {
          userId: 'u1',
          year: 2026,
          totalUnits: 310,
          adjustments: [
            {
              units: -40,
              reason: 'Duplicate plays from a stuck stream',
              createdAt: '2026-06-01T10:00:00.000Z',
              actorId: 'board-1',
            },
            {
              units: 50,
              reason: 'Missed live hours during the outage',
              createdAt: '2026-05-01T10:00:00.000Z',
              actorId: 'board-1',
            },
          ],
        },
        meta: { source: 'api' },
      });
    render(<AdminUserEngagementPanel userId="u1" />);

    expect(await screen.findByText('310')).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith('u1', new Date().getUTCFullYear());
    expect(
      screen.getByText('Duplicate plays from a stuck stream'),
    ).toBeTruthy();
    expect(screen.getByText('-40')).toBeTruthy();
    expect(screen.getByText('+50')).toBeTruthy();
  });

  it('offers a retry when the engagement read fails', async () => {
    const fetch = vi
      .spyOn(admin, 'fetchAdminUserEngagement')
      .mockResolvedValue({
        data: null,
        meta: { source: 'api', reason: '500' },
      });
    render(<AdminUserEngagementPanel userId="u1" />);

    expect(await screen.findByText("Couldn't load engagement")).toBeTruthy();
    screen.getByRole('button', { name: /try again|retry/i }).click();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});
