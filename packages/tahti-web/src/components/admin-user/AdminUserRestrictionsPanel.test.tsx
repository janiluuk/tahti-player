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
import { AdminUserRestrictionsPanel } from './AdminUserRestrictionsPanel';

const ACTIVE: admin.AccountRestriction = {
  id: 'r1',
  type: 'UPLOAD',
  reason: 'Uploading other artists’ tracks',
  bannedAt: '2026-09-01T00:00:00.000Z',
  expiresAt: null,
  liftedAt: null,
  bannedByUsername: 'board-member',
};

const LIFTED: admin.AccountRestriction = {
  id: 'r0',
  type: 'LOGIN',
  reason: 'Account takeover',
  bannedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: null,
  liftedAt: '2026-01-03T00:00:00.000Z',
  bannedByUsername: null,
};

describe('AdminUserRestrictionsPanel', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists active restrictions, keeps lifted ones under past, and lifts one', async () => {
    const fetch = vi
      .spyOn(admin, 'fetchAccountRestrictions')
      .mockResolvedValue({ data: [ACTIVE, LIFTED], meta: { source: 'api' } });
    const lift = vi
      .spyOn(admin, 'liftAccountRestriction')
      .mockResolvedValue({ ok: true });
    render(<AdminUserRestrictionsPanel userId="u1" />);

    expect(
      await screen.findByText('Uploading other artists’ tracks'),
    ).toBeTruthy();
    expect(screen.getByText('Past restrictions (1)')).toBeTruthy();
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Lift uploads restriction' }),
      );
    });
    expect(lift).toHaveBeenCalledWith('u1', 'r1');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('adds a restriction with a reason and shows a refusal', async () => {
    vi.spyOn(admin, 'fetchAccountRestrictions').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    const create = vi
      .spyOn(admin, 'createAccountRestriction')
      .mockResolvedValue({ ok: false, error: 'User not found' });
    render(<AdminUserRestrictionsPanel userId="u1" />);
    expect(await screen.findByText('No active restrictions.')).toBeTruthy();

    const add = screen.getByRole('button', { name: 'Add restriction' });
    expect((add as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText('Shown to the user'), {
      target: { value: 'Spam uploads' },
    });
    await act(async () => {
      fireEvent.click(add);
    });
    expect(create).toHaveBeenCalledWith('u1', {
      type: 'UPLOAD',
      reason: 'Spam uploads',
      durationDays: null,
    });
    expect(screen.getByRole('alert').textContent).toBe('User not found');
  });
});
