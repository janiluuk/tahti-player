import { afterEach, describe, expect, it, vi } from 'vitest';

import * as http from '../http';
import { fetchAdminUsers, type AdminUserRow } from './admin-users';

vi.mock('../mode', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../mode')>()),
  isForceMock: () => false,
}));

function user(id: string, extra: Pick<AdminUserRow, 'isBoard'>): AdminUserRow {
  return {
    id,
    memberNumber: null,
    displayName: id,
    email: `${id}@example.com`,
    username: id,
    role: extra.isBoard ? 'BOARD' : 'ARTIST',
    tier: 'ARTIST',
    isMember: true,
    suspendedAt: null,
    channelState: null,
    engagementUnitsYtd: 0,
    ...extra,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchAdminUsers role filter', () => {
  it('asks the server for board members and keeps its total', async () => {
    const getJson = vi.spyOn(http, 'getJson').mockResolvedValue({
      total: 7,
      users: [user('b1', { isBoard: true })],
    });

    const result = await fetchAdminUsers({ role: 'BOARD' });

    expect(getJson.mock.calls[0]![0]).toContain('role=BOARD');
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(7);
  });

  it('asks the server for artists by account role, studio tier included', async () => {
    const getJson = vi.spyOn(http, 'getJson').mockResolvedValue({
      total: 12,
      users: [user('a1', { isBoard: false })],
    });

    const result = await fetchAdminUsers({ role: 'ARTIST' });

    const url = getJson.mock.calls[0]![0] as string;
    expect(url).toContain('role=ARTIST');
    expect(url).not.toContain('tier=');
    expect(result.total).toBe(12);
  });

  it('keeps the rows and total the server filtered', async () => {
    vi.spyOn(http, 'getJson').mockResolvedValue({
      total: 40,
      users: [user('b1', { isBoard: true }), user('b2', { isBoard: true })],
    });

    const result = await fetchAdminUsers({ role: 'BOARD' });

    expect(result.data.map((row) => row.id)).toEqual(['b1', 'b2']);
    expect(result.total).toBe(40);
  });
});
