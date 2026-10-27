// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../api/admin';
import { renderWithRouter } from '../test/renderWithRouter';
import { AdminUserEditPanel } from './AdminUserEditPanel';

describe('AdminUserEditPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('offers Retry when the account fails to load', async () => {
    const fetch = vi.spyOn(admin, 'fetchAdminUser').mockResolvedValue({
      data: null,
      meta: { source: 'api', reason: 'HTTP 502' },
    });
    render(<AdminUserEditPanel userId="u1" />);
    expect(await screen.findByText('Could not load this account')).toBeTruthy();
    expect(screen.getByText('HTTP 502')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('says a suspension emails the reason', async () => {
    vi.spyOn(admin, 'fetchAdminUser').mockResolvedValue({
      data: {
        id: 'u1',
        memberNumber: 12,
        displayName: 'DJ Moonlight',
        email: 'moonlight@example.com',
        username: 'dj-moonlight',
        role: 'ARTIST',
        tier: 'ARTIST',
        isMember: true,
        isBoard: false,
        suspendedAt: null,
        channelState: 'OFFLINE',
        engagementUnitsYtd: 0,
        memberSince: null,
        suspendReason: null,
        fanSubscriptionsAsArtist: 0,
        stripeConnectChargesEnabled: false,
        channel: null,
      },
      meta: { source: 'api' },
    });
    await renderWithRouter(<AdminUserEditPanel userId="u1" />);
    expect(
      await screen.findByText(/They are emailed your reason/),
    ).toBeTruthy();
  });
});
