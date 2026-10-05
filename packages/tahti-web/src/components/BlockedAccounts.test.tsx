// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/blocks';
import { BlockedAccounts } from './BlockedAccounts';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const AINO: api.BlockedUser = {
  username: 'aino',
  displayName: 'Aino',
  avatarUrl: null,
  blockedAt: '2026-10-05T10:00:00.000Z',
};

describe('BlockedAccounts', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('says when nobody is blocked', async () => {
    vi.spyOn(api, 'fetchBlockedUsers').mockResolvedValue([]);
    await act(async () => {
      render(<BlockedAccounts />);
    });
    expect(screen.getByText("You haven't blocked anyone.")).toBeTruthy();
  });

  it('lists blocked accounts and unblocks one', async () => {
    vi.spyOn(api, 'fetchBlockedUsers').mockResolvedValue([AINO]);
    const unblock = vi
      .spyOn(api, 'unblockUser')
      .mockResolvedValue({ ok: true });
    await act(async () => {
      render(<BlockedAccounts />);
    });
    expect(screen.getByText('@aino')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unblock Aino' }));
    });
    expect(unblock).toHaveBeenCalledWith('aino');
    expect(screen.queryByText('@aino')).toBeNull();
    expect(screen.getByText("You haven't blocked anyone.")).toBeTruthy();
  });

  it('keeps the row and shows why when unblocking fails', async () => {
    vi.spyOn(api, 'fetchBlockedUsers').mockResolvedValue([AINO]);
    vi.spyOn(api, 'unblockUser').mockResolvedValue({
      ok: false,
      error: 'Network error',
    });
    await act(async () => {
      render(<BlockedAccounts />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unblock Aino' }));
    });
    expect(toast.error).toHaveBeenCalledWith('Network error');
    expect(screen.getByText('@aino')).toBeTruthy();
  });
});
