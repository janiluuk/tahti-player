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

    expect(getJson.mock.calls[0]![0]).toContain('isBoard=true');
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(7);
  });

  it('asks the server for non-board artists', async () => {
    const getJson = vi.spyOn(http, 'getJson').mockResolvedValue({
      total: 12,
      users: [user('a1', { isBoard: false })],
    });

    const result = await fetchAdminUsers({ role: 'ARTIST' });

    const url = getJson.mock.calls[0]![0] as string;
    expect(url).toContain('tier=ARTIST');
    expect(url).toContain('isBoard=false');
    expect(result.total).toBe(12);
  });

  it('falls back to the page count when the server ignored the filter', async () => {
    vi.spyOn(http, 'getJson').mockResolvedValue({
      total: 40,
      users: [user('a1', { isBoard: false }), user('b1', { isBoard: true })],
    });

    const result = await fetchAdminUsers({ role: 'BOARD' });

    expect(result.data.map((row) => row.id)).toEqual(['b1']);
    expect(result.total).toBe(1);
  });
});
