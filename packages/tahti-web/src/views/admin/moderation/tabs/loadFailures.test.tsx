// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as beta from '../../../../api/admin/admin-beta';
import * as radio from '../../../../api/admin/admin-radio';
import * as support from '../../../../api/admin/admin-support';
import { BetaTab } from './BetaTab';
import { RadioSubmissionsTab } from './RadioSubmissionsTab';
import { SupportTab } from './SupportTab';

const failed = { source: 'api' as const, reason: 'HTTP 502' };

describe('moderation tabs on a failed load', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('Beta shows Retry instead of "No applications"', async () => {
    const fetch = vi
      .spyOn(beta, 'fetchAdminBetaApplications')
      .mockResolvedValue({ data: [], meta: failed });
    await act(async () => {
      render(<BetaTab />);
    });
    expect(screen.getByText('Could not load beta applications')).toBeTruthy();
    expect(screen.queryByText('No applications in this view')).toBeNull();
    fetch.mockResolvedValue({ data: [], meta: { source: 'api' } });
    await act(async () => {
      screen.getByRole('button', { name: 'Retry' }).click();
    });
    expect(screen.getByText('No applications in this view')).toBeTruthy();
  });

  it('Radio submissions shows Retry instead of "No unaudited"', async () => {
    vi.spyOn(radio, 'fetchAdminRadioSubmissions').mockResolvedValue({
      data: [],
      meta: failed,
    });
    await act(async () => {
      render(<RadioSubmissionsTab />);
    });
    expect(screen.getByText('Could not load radio submissions')).toBeTruthy();
    expect(screen.queryByText('No unaudited radio submissions')).toBeNull();
  });

  it('Support shows Retry instead of "No tickets"', async () => {
    vi.spyOn(support, 'fetchAdminSupportTickets').mockResolvedValue({
      data: [],
      meta: failed,
    });
    await act(async () => {
      render(<SupportTab />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(
      await screen.findByText('Could not load support tickets'),
    ).toBeTruthy();
    expect(screen.queryByText('No tickets in this view')).toBeNull();
  });
});
