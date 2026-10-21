// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as admin from '../../api/admin';
import { AdminActivityView } from './AdminActivityView';

const poll = vi.hoisted(() => ({ current: () => {} }));
vi.mock('../../hooks/usePolling', () => ({
  usePolling: (callback: () => void) => {
    poll.current = callback;
  },
}));

const entry = {
  id: 'a1',
  action: 'USER_BANNED',
  actorId: 'u1',
  actorDisplayName: 'Admin',
  actorUsername: 'admin',
  targetId: null,
  meta: {},
  createdAt: '2026-10-21T08:00:00.000Z',
};

describe('AdminActivityView', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps loaded entries when a poll fails', async () => {
    const fetch = vi.spyOn(admin, 'fetchAdminActivity').mockResolvedValue({
      data: [entry, { ...entry, id: 'a2' }],
      total: 2,
      page: 1,
      limit: 50,
      meta: { source: 'api' },
    } as never);
    render(<AdminActivityView embedded />);
    expect(await screen.findByText(/^2 events/)).toBeTruthy();

    fetch.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 50,
      meta: { source: 'api', reason: 'HTTP 502' },
    } as never);
    await act(async () => {
      poll.current();
    });
    expect(await screen.findByText("Couldn't refresh activity")).toBeTruthy();
    expect(screen.getByText(/^2 events/)).toBeTruthy();
  });

  it('shows an error with Retry when the first load fails', async () => {
    vi.spyOn(admin, 'fetchAdminActivity').mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 50,
      meta: { source: 'api', reason: 'HTTP 502' },
    } as never);
    render(<AdminActivityView embedded />);
    expect(await screen.findByText("Couldn't load activity")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });
});
