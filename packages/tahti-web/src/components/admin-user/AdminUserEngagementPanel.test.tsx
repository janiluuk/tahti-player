// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
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

  it('adds a board adjustment for the current year and reloads the total', async () => {
    const year = new Date().getUTCFullYear();
    const fetch = vi
      .spyOn(admin, 'fetchAdminUserEngagement')
      .mockResolvedValue({
        data: { userId: 'u1', year, totalUnits: 100, adjustments: [] },
        meta: { source: 'api' },
      });
    const create = vi
      .spyOn(admin, 'createEngagementAdjustment')
      .mockResolvedValue({ ok: true });
    render(<AdminUserEngagementPanel userId="u1" />);
    await screen.findByText('100');

    const add = screen.getByRole('button', { name: 'Add adjustment' });
    expect((add as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Units'), {
      target: { value: '-10' },
    });
    fireEvent.change(screen.getByPlaceholderText('Shown in the audit log'), {
      target: { value: 'Bot plays' },
    });
    await act(async () => {
      fireEvent.click(add);
    });
    expect(create).toHaveBeenCalledWith({
      userId: 'u1',
      units: -10,
      reason: 'Bot plays',
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('shows past years read-only', async () => {
    const year = new Date().getUTCFullYear() - 1;
    vi.spyOn(admin, 'fetchAdminUserEngagement').mockResolvedValue({
      data: { userId: 'u1', year, totalUnits: 5, adjustments: [] },
      meta: { source: 'api' },
    });
    render(<AdminUserEngagementPanel userId="u1" />);
    await screen.findByText('5');
    expect(screen.queryByRole('button', { name: 'Add adjustment' })).toBeNull();
  });
});
