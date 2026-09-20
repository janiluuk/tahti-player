import { getAccountRole } from '../../lib/accountRoles';
import type { FetchMeta } from '../client';
import { getJson, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';
import type { AccountRole } from '../types';

// ── Users ───────────────────────────────────────────────────────────────────

export type AdminUserRow = {
  id: string;
  memberNumber: number | null;
  displayName: string;
  email: string;
  username: string;
  role: AccountRole;
  tier: string;
  isMember: boolean;
  isBoard: boolean;
  suspendedAt: string | null;
  channelState: string | null;
  engagementUnitsYtd: number;
};

export type AdminUserDetail = AdminUserRow & {
  memberSince: string | null;
  suspendReason: string | null;
  fanSubscriptionsAsArtist: number;
  stripeConnectChargesEnabled: boolean;
  channel: {
    id: string;
    slug: string;
    state: string;
    goneLiveAt: string | null;
    totalLiveHours: number;
    metaStreamOptOut?: boolean;
  } | null;
};

export type AdminUserPatch = {
  role?: AccountRole;
  tier?: 'FREE' | 'ARTIST' | 'STUDIO';
  isMember?: boolean;
  isBoard?: boolean;
  memberNumber?: number | null;
};

let mockUserState: AdminUserRow[] | null = null;
const mockSuspendReasons = new Map<string, string>();

function mockUsers(): AdminUserRow[] {
  if (mockUserState) {
    return mockUserState;
  }
  mockUserState = [
    {
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
      channelState: 'LIVE',
      engagementUnitsYtd: 842,
    },
    {
      id: 'u2',
      memberNumber: 4,
      displayName: 'Northern Lights',
      email: 'aurora@example.com',
      username: 'northern-lights',
      role: 'BOARD',
      tier: 'ARTIST',
      isMember: true,
      isBoard: true,
      suspendedAt: null,
      channelState: 'OFFLINE',
      engagementUnitsYtd: 1290,
    },
    {
      id: 'u3',
      memberNumber: null,
      displayName: 'Listener One',
      email: 'listener1@example.com',
      username: 'listener-one',
      role: 'LISTENER',
      tier: 'FREE',
      isMember: false,
      isBoard: false,
      suspendedAt: null,
      channelState: null,
      engagementUnitsYtd: 12,
    },
    {
      id: 'u4',
      memberNumber: 7,
      displayName: 'Midnight Cartography',
      email: 'midnight@example.com',
      username: 'midnight-cartography',
      role: 'ARTIST',
      tier: 'ARTIST',
      isMember: true,
      isBoard: false,
      suspendedAt: '2026-07-01T00:00:00.000Z',
      channelState: 'OFFLINE',
      engagementUnitsYtd: 340,
    },
  ];
  return mockUserState;
}

function mockUserDetail(user: AdminUserRow): AdminUserDetail {
  return {
    ...user,
    memberSince: user.isMember ? '2025-01-15T00:00:00.000Z' : null,
    suspendReason: mockSuspendReasons.get(user.id) ?? null,
    fanSubscriptionsAsArtist: user.role !== 'LISTENER' ? 18 : 0,
    stripeConnectChargesEnabled: user.role !== 'LISTENER',
    channel: user.channelState
      ? {
          id: `channel-${user.id}`,
          slug: user.username,
          state: user.channelState,
          goneLiveAt:
            user.channelState === 'LIVE' ? new Date().toISOString() : null,
          totalLiveHours: 42.5,
        }
      : null,
  };
}

export async function fetchAdminUsers(filters: {
  q?: string;
  role?: string;
  isMember?: string;
}): Promise<{ data: AdminUserRow[]; total: number; meta: FetchMeta }> {
  if (isForceMock()) {
    let rows = mockUsers();
    if (filters.q) {
      const q = filters.q.toLowerCase();
      rows = rows.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q),
      );
    }
    if (filters.role) {
      rows = rows.filter((user) => user.role === filters.role);
    }
    if (filters.isMember) {
      rows = rows.filter((u) => String(u.isMember) === filters.isMember);
    }
    return {
      data: rows,
      total: rows.length,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const qs = new URLSearchParams();
    if (filters.q) {
      qs.set('search', filters.q);
    }
    if (filters.role === 'ARTIST' || filters.role === 'BOARD') {
      qs.set('tier', 'ARTIST');
    } else if (filters.role === 'LISTENER') {
      qs.set('tier', 'FREE');
    }
    if (filters.isMember) {
      qs.set('isMember', filters.isMember);
    }
    const data = await getJson<{ total: number; users: AdminUserRow[] }>(
      `/api/admin/users${qs.toString() ? `?${qs.toString()}` : ''}`,
    );
    const users = data.users.map((user) => ({
      ...user,
      role: getAccountRole(user),
    }));
    const filteredUsers = filters.role
      ? users.filter((user) => user.role === filters.role)
      : users;
    return {
      data: filteredUsers,
      total: filters.role ? filteredUsers.length : data.total,
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], total: 0, meta: failMeta(err) };
  }
}

export async function fetchAdminUser(
  id: string,
): Promise<{ data: AdminUserDetail | null; meta: FetchMeta }> {
  if (isForceMock()) {
    const user = mockUsers().find((candidate) => candidate.id === id);
    return {
      data: user ? mockUserDetail(user) : null,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminUserDetail>(
      `/api/admin/users/${encodeURIComponent(id)}`,
    );
    return {
      data: { ...data, role: getAccountRole(data) },
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function patchAdminUser(
  id: string,
  patch: AdminUserPatch,
): Promise<{ ok: true; data: AdminUserDetail } | { ok: false; error: string }> {
  if (isForceMock()) {
    const users = mockUsers();
    const index = users.findIndex((candidate) => candidate.id === id);
    if (index < 0) {
      return { ok: false, error: 'User not found' };
    }
    const current = users[index]!;
    const role = patch.role ?? current.role;
    const legacyRole = {
      tier: role === 'LISTENER' ? 'FREE' : 'ARTIST',
      isBoard: role === 'BOARD',
    };
    users[index] = {
      ...current,
      ...patch,
      ...legacyRole,
      role,
      isMember: role === 'BOARD' ? true : (patch.isMember ?? current.isMember),
    };
    return { ok: true, data: mockUserDetail(users[index]!) };
  }
  try {
    const legacyPatch = patch.role
      ? {
          ...patch,
          tier:
            patch.role === 'LISTENER' ? ('FREE' as const) : ('ARTIST' as const),
          isBoard: patch.role === 'BOARD',
        }
      : patch;
    const data = await sendJson<AdminUserDetail>(
      `/api/admin/users/${encodeURIComponent(id)}`,
      'PATCH',
      legacyPatch,
    );
    return { ok: true, data: { ...data, role: getAccountRole(data) } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
}

export async function suspendAdminUser(
  id: string,
  reason: string,
): Promise<{ ok: true; data: AdminUserDetail } | { ok: false; error: string }> {
  if (isForceMock()) {
    const user = mockUsers().find((candidate) => candidate.id === id);
    if (!user) {
      return { ok: false, error: 'User not found' };
    }
    user.suspendedAt = new Date().toISOString();
    mockSuspendReasons.set(id, reason);
    return { ok: true, data: mockUserDetail(user) };
  }
  try {
    const data = await sendJson<AdminUserDetail>(
      `/api/admin/users/${encodeURIComponent(id)}/suspend`,
      'POST',
      { reason },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Suspension failed',
    };
  }
}

export async function unsuspendAdminUser(
  id: string,
): Promise<{ ok: true; data: AdminUserDetail } | { ok: false; error: string }> {
  if (isForceMock()) {
    const user = mockUsers().find((candidate) => candidate.id === id);
    if (!user) {
      return { ok: false, error: 'User not found' };
    }
    user.suspendedAt = null;
    mockSuspendReasons.delete(id);
    return { ok: true, data: mockUserDetail(user) };
  }
  try {
    const data = await sendJson<AdminUserDetail>(
      `/api/admin/users/${encodeURIComponent(id)}/unsuspend`,
      'POST',
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unsuspend failed',
    };
  }
}
