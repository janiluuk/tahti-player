import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/me-restrictions';
import { RestrictionNotice, RestrictionNotices } from './RestrictionNotice';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RestrictionNotice', () => {
  it('shows the ban of its type with the reason and end date', async () => {
    vi.spyOn(api, 'fetchMyRestrictions').mockResolvedValue([
      {
        type: 'LIVE_SHOW_BOOKING',
        reason: 'No-shows',
        expiresAt: null,
      },
      {
        type: 'UPLOAD',
        reason: 'Copyright strikes',
        expiresAt: '2026-11-03T12:00:00.000Z',
      },
    ]);
    render(<RestrictionNotice type="UPLOAD" />);
    expect(
      await screen.findByText(/^Uploads are blocked until .*2026$/),
    ).toBeTruthy();
    expect(screen.getByText('Reason: Copyright strikes')).toBeTruthy();
    expect(screen.queryByText(/No-shows/)).toBeNull();
  });

  it('renders nothing without a ban', async () => {
    const fetch = vi.spyOn(api, 'fetchMyRestrictions').mockResolvedValue([]);
    const { container } = render(<RestrictionNotice type="UPLOAD" />);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container.textContent).toBe('');
  });

  it('lists every active restriction for Settings', async () => {
    vi.spyOn(api, 'fetchMyRestrictions').mockResolvedValue([
      { type: 'UPLOAD', reason: 'Copyright strikes', expiresAt: null },
      { type: 'LIVE_SHOW_BOOKING', reason: 'No-shows', expiresAt: null },
    ]);
    render(<RestrictionNotices />);
    expect(await screen.findByText('Uploads are blocked')).toBeTruthy();
    expect(screen.getByText('Booking shows is blocked')).toBeTruthy();
  });
});
