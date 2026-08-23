import { getAccountRole } from '../lib/accountRoles';
import type { FetchMeta } from './client';
import type { AccountRole } from './types';

const forceMock = () => import.meta.env.VITE_FORCE_MOCK === '1';

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

function failMeta(err: unknown): FetchMeta {
  return {
    source: 'mock',
    reason: err instanceof Error ? err.message : 'fetch failed',
  };
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`${path} → ${res.status}`);
  }
  return (await res.json()) as T;
}

async function sendJson<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const errBody = (await res.json()) as { error?: string };
      if (errBody.error) {
        detail = errBody.error;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

async function mutate(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await sendJson(path, method, body);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export type AdminActionRow = {
  id: string;
  title: string;
  meta: string;
  actionLabel: string;
  actionTone: 'primary' | 'amber';
  href: string;
};

export type AdminSystemHealth = {
  icecast: 'up' | 'down';
  minio: 'up' | 'down';
  postgresBackupAgeHours: number | null;
  failedFanSubPayouts: number;
};

export type AdminQueueRow = { name: string; waiting: number; failed: number };

export type AdminCronRow = {
  jobName: string;
  description: string;
  lastRun: { outcome: string | null; startedAt: string } | null;
};

export type AdminAuditRow = {
  id: string;
  action: string;
  actorId: string;
  createdAt: string;
};

export type AdminLiveStream = {
  slug: string;
  artistName: string;
  elapsedSec: number;
};

export type AdminDashboard = {
  kpis: {
    activeMembers: number;
    liveNow: number;
    betaQueue: number;
    openTickets: number;
  };
  actionRows: AdminActionRow[];
  health: AdminSystemHealth;
  financeYtdCents: { surplus: number; revenue: number; costs: number };
  liveStreams: AdminLiveStream[];
  queues: AdminQueueRow[];
  cronJobs: AdminCronRow[];
  audit: AdminAuditRow[];
};

function mockDashboard(): AdminDashboard {
  return {
    kpis: { activeMembers: 214, liveNow: 3, betaQueue: 5, openTickets: 2 },
    actionRows: [
      {
        id: 'beta-1',
        title: 'Kaiku Collective · dj',
        meta: 'Beta application · applied 12 Aug',
        actionLabel: 'Approve',
        actionTone: 'primary',
        href: '/admin/beta',
      },
      {
        id: 'venue-1',
        title: 'Boathouse Studio, Savonlinna',
        meta: 'Venue verification · submitted 10 Aug',
        actionLabel: 'Verify',
        actionTone: 'primary',
        href: '/admin/venues',
      },
      {
        id: 'payout-1',
        title: '@midnight-cartography — €84.20',
        meta: 'Fan-sub payout failed',
        actionLabel: 'Retry',
        actionTone: 'amber',
        href: '/admin/financial',
      },
    ],
    health: {
      icecast: 'up',
      minio: 'up',
      postgresBackupAgeHours: 6,
      failedFanSubPayouts: 1,
    },
    financeYtdCents: { surplus: 482000, revenue: 1240000, costs: 758000 },
    liveStreams: [
      {
        slug: 'northern-lights',
        artistName: 'Northern Lights',
        elapsedSec: 5400,
      },
      { slug: 'dj-moonlight', artistName: 'DJ Moonlight', elapsedSec: 1860 },
    ],
    queues: [
      { name: 'transcode', waiting: 2, failed: 0 },
      { name: 'fansub-payouts', waiting: 0, failed: 1 },
      { name: 'email', waiting: 4, failed: 0 },
    ],
    cronJobs: [
      {
        jobName: 'nightly-backup',
        description: 'Postgres dump to offsite storage',
        lastRun: { outcome: 'SUCCESS', startedAt: '2026-08-17T03:00:00.000Z' },
      },
      {
        jobName: 'fansub-payout-sweep',
        description: 'Retry failed Stripe transfers',
        lastRun: { outcome: 'ERROR', startedAt: '2026-08-17T02:00:00.000Z' },
      },
    ],
    audit: [
      {
        id: 'a1',
        action: 'venue.verify',
        actorId: 'board-jani',
        createdAt: '2026-08-16T18:20:00.000Z',
      },
      {
        id: 'a2',
        action: 'beta.approve',
        actorId: 'board-jani',
        createdAt: '2026-08-16T14:05:00.000Z',
      },
    ],
  };
}

/** Aggregated admin dashboard — prod fans this out to ~12 separate
 * `/api/admin/*` calls; batched here into one Promise.all for a first port. */
export async function fetchAdminDashboard(): Promise<{
  data: AdminDashboard;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockDashboard(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const [
      members,
      streams,
      betaRes,
      support,
      health,
      ytd,
      queues,
      cron,
      audit,
    ] = await Promise.all([
      getJson<{ total: number }>('/api/admin/stats/members'),
      getJson<{ count: number; streams: AdminLiveStream[] }>(
        '/api/admin/streams',
      ),
      getJson<{ applications: unknown[] }>(
        '/api/admin/beta/applications?status=PENDING&limit=100',
      ),
      getJson<{ total: number }>(
        '/api/admin/support/tickets?status=OPEN&limit=1',
      ),
      getJson<AdminSystemHealth>('/api/admin/stats/system-health'),
      getJson<{ runningSurplus: string; byCategory: Record<string, string> }>(
        '/api/v1/transparency/ytd',
      ),
      getJson<AdminQueueRow[]>('/api/admin/stats/queues'),
      getJson<AdminCronRow[]>('/api/admin/stats/cron-runs'),
      getJson<AdminAuditRow[]>('/api/admin/audit/recent'),
    ]);
    const revenue = Object.entries(ytd.byCategory)
      .filter(([k]) => k.startsWith('REVENUE_'))
      .reduce((s, [, v]) => s + parseInt(v, 10), 0);
    const costs = Object.entries(ytd.byCategory)
      .filter(([k]) => k.startsWith('COST_'))
      .reduce((s, [, v]) => s + parseInt(v, 10), 0);
    return {
      data: {
        kpis: {
          activeMembers: members.total,
          liveNow: streams.count,
          betaQueue: betaRes.applications.length,
          openTickets: support.total,
        },
        actionRows: [],
        health,
        financeYtdCents: {
          surplus: parseInt(ytd.runningSurplus, 10),
          revenue,
          costs,
        },
        liveStreams: streams.streams,
        queues: queues.filter((q) => q.name !== '_queue_total'),
        cronJobs: cron,
        audit,
      },
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: mockDashboard(), meta: failMeta(err) };
  }
}

// ── Beta applications ──────────────────────────────────────────────────────

export type AdminBetaStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AdminBetaApplication = {
  id: string;
  name: string;
  email: string;
  artistType: string;
  links: string | null;
  message: string | null;
  status: AdminBetaStatus;
  userId: string | null;
  username: string | null;
  hasPassword: boolean;
  setupUrl: string | null;
  createdAt: string;
};

function mockBetaApplications(): AdminBetaApplication[] {
  return [
    {
      id: 'beta-1',
      name: 'Kaiku Collective',
      email: 'hello@kaikucollective.fi',
      artistType: 'dj',
      links: 'https://soundcloud.com/kaikucollective',
      message:
        'Six of us trading a weekly slot, closing with a freestyle line.',
      status: 'PENDING',
      userId: null,
      username: null,
      hasPassword: false,
      setupUrl: null,
      createdAt: '2026-08-12T10:00:00.000Z',
    },
    {
      id: 'beta-2',
      name: 'Valo Radio',
      email: 'valo@tahti.example',
      artistType: 'radio',
      links: null,
      message: 'Monthly all-night synth streams out of Tampere.',
      status: 'APPROVED',
      userId: 'mock-valo',
      username: 'valo-radio',
      hasPassword: false,
      setupUrl: 'https://beta.tahti.live/setup-password?token=mock-valo',
      createdAt: '2026-08-08T09:00:00.000Z',
    },
    {
      id: 'beta-3',
      name: 'Static Bloom',
      email: 'static@example.com',
      artistType: 'band',
      links: null,
      message: null,
      status: 'REJECTED',
      userId: null,
      username: null,
      hasPassword: false,
      setupUrl: null,
      createdAt: '2026-08-01T09:00:00.000Z',
    },
  ];
}

export async function fetchAdminBetaApplications(
  status?: AdminBetaStatus,
): Promise<{ data: AdminBetaApplication[]; meta: FetchMeta }> {
  if (forceMock()) {
    const all = mockBetaApplications();
    return {
      data: status ? all.filter((a) => a.status === status) : all,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const qs = new URLSearchParams({ limit: '100' });
    if (status) {
      qs.set('status', status);
    }
    const data = await getJson<{ applications: AdminBetaApplication[] }>(
      `/api/admin/beta/applications?${qs.toString()}`,
    );
    return { data: data.applications, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function approveBetaApplication(
  id: string,
  input: { username: string; displayName: string },
): Promise<
  { ok: true; setupUrl: string | null } | { ok: false; error: string }
> {
  if (forceMock()) {
    return {
      ok: true,
      setupUrl: `https://beta.tahti.live/setup-password?token=mock-${id}`,
    };
  }
  try {
    const res = await sendJson<{ setupUrl: string | null }>(
      `/api/admin/beta/applications/${encodeURIComponent(id)}/approve`,
      'POST',
      input,
    );
    return { ok: true, setupUrl: res.setupUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

export async function rejectBetaApplication(id: string) {
  if (forceMock()) {
    return { ok: true } as const;
  }
  return mutate(
    `/api/admin/beta/applications/${encodeURIComponent(id)}/reject`,
    'POST',
  );
}

export async function resendBetaSetupLink(
  id: string,
): Promise<
  { ok: true; setupUrl: string | null } | { ok: false; error: string }
> {
  if (forceMock()) {
    return {
      ok: true,
      setupUrl: `https://beta.tahti.live/setup-password?token=resent-${id}`,
    };
  }
  try {
    const res = await sendJson<{ setupUrl: string | null }>(
      `/api/admin/beta/applications/${encodeURIComponent(id)}/resend-setup`,
      'POST',
    );
    return { ok: true, setupUrl: res.setupUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

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
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
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

// ── Radio ops ───────────────────────────────────────────────────────────────

export type AdminRadioChannel = {
  channelId: string;
  slug: string;
  artistName: string;
  lastFeaturedAt: string | null;
};

export type AdminRadioHistoryItem = {
  channelId: string;
  slug: string;
  artistName: string;
  featuredAt: string;
};

export type AdminRadioOptedOut = {
  channelId: string;
  slug: string;
  artistName: string;
  isLive: boolean;
};

export type AdminRadioData = {
  nowPlaying: { live: boolean; slug: string | null; artistName: string | null };
  eligible: AdminRadioChannel[];
  history: AdminRadioHistoryItem[];
  optedOut: AdminRadioOptedOut[];
};

function mockRadioAdmin(): AdminRadioData {
  return {
    nowPlaying: {
      live: false,
      slug: null,
      artistName: null,
    },
    eligible: [
      {
        channelId: 'c1',
        slug: 'northern-lights',
        artistName: 'Northern Lights',
        lastFeaturedAt: '2026-08-16T20:00:00.000Z',
      },
      {
        channelId: 'c2',
        slug: 'dj-moonlight',
        artistName: 'DJ Moonlight',
        lastFeaturedAt: null,
      },
    ],
    history: [
      {
        channelId: 'c3',
        slug: 'kaiku-collective',
        artistName: 'Kaiku Collective',
        featuredAt: '2026-08-16T14:00:00.000Z',
      },
      {
        channelId: 'c1',
        slug: 'northern-lights',
        artistName: 'Northern Lights',
        featuredAt: '2026-08-15T21:00:00.000Z',
      },
    ],
    optedOut: [
      {
        channelId: 'c4',
        slug: 'tundra-static',
        artistName: 'Tundra Static',
        isLive: false,
      },
    ],
  };
}

export async function fetchAdminRadio(): Promise<{
  data: AdminRadioData;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockRadioAdmin(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{
      nowPlaying: {
        live: boolean;
        channel: { slug: string; artistName: string } | null;
      };
      eligible: AdminRadioChannel[];
      history: AdminRadioHistoryItem[];
      optedOut: AdminRadioOptedOut[];
    }>('/api/admin/radio');
    return {
      data: {
        nowPlaying: {
          live: data.nowPlaying.live,
          slug: data.nowPlaying.channel?.slug ?? null,
          artistName: data.nowPlaying.channel?.artistName ?? null,
        },
        eligible: data.eligible,
        history: data.history,
        optedOut: data.optedOut,
      },
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: mockRadioAdmin(), meta: failMeta(err) };
  }
}

export function radioMoveToFront(channelId: string) {
  if (forceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio/${encodeURIComponent(channelId)}/reset-rotation`,
    'POST',
  );
}

export function radioOptOut(channelId: string) {
  if (forceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio/${encodeURIComponent(channelId)}/opt-out`,
    'POST',
  );
}

export function radioRemoveOptOut(channelId: string) {
  if (forceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio/${encodeURIComponent(channelId)}/opt-out`,
    'DELETE',
  );
}

// ── Radio submissions ───────────────────────────────────────────────────────

export type AdminRadioSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AdminRadioSubmission = {
  id: string;
  status: AdminRadioSubmissionStatus;
  rejectionNote: string | null;
  createdAt: string;
  submitter: { username: string; displayName: string } | null;
  archiveItem: {
    id: string;
    title: string;
    artistName: string | null;
    durationSec: number | null;
    bannerUrl: string | null;
    audioUrl: string | null;
  };
};

function mockRadioSubmissions(): AdminRadioSubmission[] {
  return [
    {
      id: 'sub-1',
      status: 'PENDING',
      rejectionNote: null,
      createdAt: '2026-08-16T12:00:00.000Z',
      submitter: { username: 'dj-moonlight', displayName: 'DJ Moonlight' },
      archiveItem: {
        id: 'arch-sub-1',
        title: 'Moonlight Drive',
        artistName: 'DJ Moonlight',
        durationSec: 312,
        bannerUrl: '/mock/dj-moonlight/cover-moonlight-drive.svg',
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
    },
    {
      id: 'sub-2',
      status: 'PENDING',
      rejectionNote: null,
      createdAt: '2026-08-15T09:30:00.000Z',
      submitter: {
        username: 'kaiku-collective',
        displayName: 'Kaiku Collective',
      },
      archiveItem: {
        id: 'arch-sub-2',
        title: 'Echo Chamber Cypher',
        artistName: 'Kaiku Collective',
        durationSec: 254,
        bannerUrl: null,
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
    },
  ];
}

export async function fetchAdminRadioSubmissions(): Promise<{
  data: AdminRadioSubmission[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockRadioSubmissions(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{
      items?: AdminRadioSubmission[];
      submissions?: AdminRadioSubmission[];
    }>('/api/admin/radio-submissions?status=PENDING');
    return {
      data: data.items ?? data.submissions ?? [],
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchAdminRadioSubmissionAudio(id: string): Promise<
  | {
      ok: true;
      data: {
        audioUrl: string;
        title: string;
        artistName: string;
        archiveItemId: string;
      };
    }
  | { ok: false; error: string }
> {
  if (forceMock()) {
    const row = mockRadioSubmissions().find((item) => item.id === id);
    if (!row?.archiveItem.audioUrl) {
      return { ok: false, error: 'No playable audio' };
    }
    return {
      ok: true,
      data: {
        audioUrl: row.archiveItem.audioUrl,
        title: row.archiveItem.title,
        artistName:
          row.archiveItem.artistName ?? row.submitter?.displayName ?? '',
        archiveItemId: row.archiveItem.id,
      },
    };
  }
  try {
    const data = await getJson<{
      audioUrl: string;
      title: string;
      artistName: string;
      archiveItemId: string;
    }>(`/api/admin/radio-submissions/${encodeURIComponent(id)}/audio`);
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Audio could not be loaded',
    };
  }
}

export function approveRadioSubmission(id: string) {
  if (forceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio-submissions/${encodeURIComponent(id)}/approve`,
    'POST',
  );
}

export function rejectRadioSubmission(id: string, note?: string) {
  if (forceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio-submissions/${encodeURIComponent(id)}/reject`,
    'POST',
    note ? { note } : undefined,
  );
}

// ── News ────────────────────────────────────────────────────────────────────

export type AdminNewsPost = {
  id: string;
  headline: string;
  summary: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  authorName: string;
  publishedAt: string | null;
  createdAt: string;
};

function mockNewsPosts(): AdminNewsPost[] {
  return [
    {
      id: 'news-1',
      headline: 'Fair-rotation radio now covers 9 channels',
      summary:
        'Tahti Radio auto-features any member channel that goes live — no editorial picks.',
      authorName: 'Board',
      publishedAt: '2026-08-10T09:00:00.000Z',
      createdAt: '2026-08-10T08:30:00.000Z',
    },
    {
      id: 'news-2',
      headline: 'AGM date set for October',
      summary: 'Draft agenda circulating to members this week.',
      authorName: 'Board',
      publishedAt: null,
      createdAt: '2026-08-14T10:00:00.000Z',
    },
  ];
}

const MOCK_NEWS_STORAGE_KEY = 'tahti-web-mock-news';

let mockNewsState: AdminNewsPost[] | null = null;

function persistNewsState(posts: AdminNewsPost[]): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(MOCK_NEWS_STORAGE_KEY, JSON.stringify(posts));
  }
}

function storedNewsState(): AdminNewsPost[] | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(MOCK_NEWS_STORAGE_KEY);
  if (!stored) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as AdminNewsPost[]) : null;
  } catch {
    return null;
  }
}

function newsState(): AdminNewsPost[] {
  if (!mockNewsState) {
    mockNewsState = storedNewsState() ?? mockNewsPosts();
  }
  return mockNewsState;
}

export function listMockPublishedNews(): AdminNewsPost[] {
  return newsState().filter((post) => Boolean(post.publishedAt));
}

export async function fetchAdminNews(): Promise<{
  data: AdminNewsPost[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: newsState(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminNewsPost[] | { posts: AdminNewsPost[] }>(
      '/api/admin/news',
    );
    return {
      data: Array.isArray(data) ? data : data.posts,
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createNewsPost(input: {
  headline: string;
  summary: string;
  imageUrl?: string;
  linkUrl?: string;
  linkLabel?: string;
  publish: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    const posts = newsState();
    posts.unshift({
      id: `news-${Date.now()}`,
      headline: input.headline,
      summary: input.summary,
      imageUrl: input.imageUrl?.trim() || null,
      linkUrl: input.linkUrl?.trim() || null,
      linkLabel: input.linkLabel?.trim() || null,
      authorName: 'Demo Board',
      publishedAt: input.publish ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    });
    persistNewsState(posts);
    return { ok: true };
  }
  return mutate('/api/admin/news', 'POST', input);
}

export async function updateNewsPost(
  id: string,
  input: {
    headline?: string;
    summary?: string;
    imageUrl?: string | null;
    linkUrl?: string | null;
    linkLabel?: string | null;
    publish?: boolean;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    const post = newsState().find((p) => p.id === id);
    if (post) {
      if (input.headline != null) {
        post.headline = input.headline;
      }
      if (input.summary != null) {
        post.summary = input.summary;
      }
      if (input.imageUrl !== undefined) {
        post.imageUrl = input.imageUrl?.trim() || null;
      }
      if (input.linkUrl !== undefined) {
        post.linkUrl = input.linkUrl?.trim() || null;
      }
      if (input.linkLabel !== undefined) {
        post.linkLabel = input.linkLabel?.trim() || null;
      }
      if (input.publish != null) {
        post.publishedAt = input.publish ? new Date().toISOString() : null;
      }
      persistNewsState(newsState());
    }
    return { ok: true };
  }
  return mutate(`/api/admin/news/${encodeURIComponent(id)}`, 'PATCH', input);
}

export async function deleteNewsPost(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    mockNewsState = newsState().filter((p) => p.id !== id);
    persistNewsState(mockNewsState);
    return { ok: true };
  }
  return mutate(`/api/admin/news/${encodeURIComponent(id)}`, 'DELETE');
}

// ── Tahti Selects ───────────────────────────────────────────────────────────

export type AdminSelectsItem = {
  id: string;
  archiveItemId: string;
  title: string;
  durationSec: number | null;
  license: string;
  artistName: string;
  channelSlug: string;
  addedBy: string;
  audioUrl?: string | null;
};

export type AdminSelectsBrowseItem = {
  id: string;
  title: string;
  durationSec: number | null;
  license: string;
  artistName: string;
  channelSlug: string;
  audioUrl?: string | null;
};

export type AdminSelectsStream = {
  state: 'OFFLINE' | 'STARTING' | 'LIVE' | string;
  hlsUrl: string | null;
  nowPlaying: {
    title: string;
    artistName: string;
    artworkUrl?: string | null;
  } | null;
};

let mockSelectsItems: AdminSelectsItem[] | null = null;
let mockSelectsStreamRunning = false;

function selectsState(): AdminSelectsItem[] {
  if (!mockSelectsItems) {
    mockSelectsItems = [
      {
        id: 'sel-1',
        archiveItemId: 'arch-nl-1',
        title: 'Aurora Drift',
        durationSec: 372,
        license: 'CC_BY',
        artistName: 'Northern Lights',
        channelSlug: 'northern-lights',
        addedBy: 'board-jani',
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      },
      {
        id: 'sel-2',
        archiveItemId: 'arch-mc-1',
        title: 'Route 550',
        durationSec: 541,
        license: 'CC_BY_SA',
        artistName: 'Midnight Cartography',
        channelSlug: 'midnight-cartography',
        addedBy: 'board-jani',
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
    ];
  }
  return mockSelectsItems;
}

function mockSelectsBrowse(): AdminSelectsBrowseItem[] {
  return [
    {
      id: 'arch-dj-1',
      title: 'Moonlight Drive',
      durationSec: 312,
      license: 'CC_BY',
      artistName: 'DJ Moonlight',
      channelSlug: 'dj-moonlight',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
      id: 'arch-kc-1',
      title: 'Echo Chamber Cypher',
      durationSec: 254,
      license: 'ALL_RIGHTS_RESERVED',
      artistName: 'Kaiku Collective',
      channelSlug: 'kaiku-collective',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
  ];
}

export async function fetchAdminSelects(): Promise<{
  data: { items: AdminSelectsItem[]; stream: AdminSelectsStream };
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const current = selectsState()[0] ?? null;
    return {
      data: {
        items: selectsState(),
        stream: {
          state: mockSelectsStreamRunning ? 'LIVE' : 'OFFLINE',
          hlsUrl: mockSelectsStreamRunning ? (current?.audioUrl ?? null) : null,
          nowPlaying:
            mockSelectsStreamRunning && current
              ? { title: current.title, artistName: current.artistName }
              : null,
        },
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const rotation = await getJson<{ items: AdminSelectsItem[] }>(
      '/api/admin/tahti-selects',
    );
    let stream: AdminSelectsStream = {
      state: 'OFFLINE',
      hlsUrl: null,
      nowPlaying: null,
    };
    try {
      stream = await getJson<AdminSelectsStream>('/api/channels/tahti-selects');
    } catch {
      stream = { state: 'OFFLINE', hlsUrl: null, nowPlaying: null };
    }
    return {
      data: { items: rotation.items ?? [], stream },
      meta: { source: 'api' },
    };
  } catch (err) {
    return {
      data: {
        items: [],
        stream: { state: 'OFFLINE', hlsUrl: null, nowPlaying: null },
      },
      meta: failMeta(err),
    };
  }
}

export async function searchAdminSelectsBrowse(
  q: string,
): Promise<{ data: AdminSelectsBrowseItem[]; meta: FetchMeta }> {
  if (forceMock()) {
    const query = q.toLowerCase();
    return {
      data: mockSelectsBrowse().filter((i) =>
        i.title.toLowerCase().includes(query),
      ),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ items: AdminSelectsBrowseItem[] }>(
      `/api/admin/tahti-selects/browse?q=${encodeURIComponent(q)}`,
    );
    return { data: data.items, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function addToSelectsRotation(item: AdminSelectsBrowseItem) {
  if (forceMock()) {
    selectsState().push({
      id: `sel-${Date.now()}`,
      archiveItemId: item.id,
      title: item.title,
      durationSec: item.durationSec,
      license: item.license,
      artistName: item.artistName,
      channelSlug: item.channelSlug,
      addedBy: 'you',
    });
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/tahti-selects/items', 'POST', {
    archiveItemId: item.id,
  });
}

export function removeFromSelectsRotation(id: string) {
  if (forceMock()) {
    mockSelectsItems = selectsState().filter((i) => i.id !== id);
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/tahti-selects/items/${encodeURIComponent(id)}`,
    'DELETE',
  );
}

export function reorderSelectsItem(id: string, position: number) {
  if (forceMock()) {
    const items = selectsState();
    const idx = items.findIndex((i) => i.id === id);
    const target = Math.max(0, Math.min(position, items.length - 1));
    if (idx < 0 || target < 0 || target >= items.length) {
      return Promise.resolve({ ok: true } as const);
    }
    [items[idx], items[target]] = [items[target]!, items[idx]!];
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/tahti-selects/items/${encodeURIComponent(id)}/reorder`,
    'PATCH',
    { position },
  );
}

export function reorderSelectsRotation(itemIds: string[]) {
  if (forceMock()) {
    const byId = new Map(selectsState().map((item) => [item.id, item]));
    mockSelectsItems = itemIds
      .map((id) => byId.get(id))
      .filter((item): item is AdminSelectsItem => Boolean(item));
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/tahti-selects/reorder', 'PUT', {
    itemIds,
  });
}

export function startSelectsStream() {
  if (forceMock()) {
    mockSelectsStreamRunning = true;
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/tahti-selects/stream/start', 'POST');
}

export function stopSelectsStream() {
  if (forceMock()) {
    mockSelectsStreamRunning = false;
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/tahti-selects/stream/stop', 'POST');
}

// ── Stream manager ──────────────────────────────────────────────────────────

export type AdminLiveStreamRow = {
  slug: string;
  artistName: string;
  username: string;
  elapsedSec: number;
  goneLiveAt: string | null;
  hlsUrl: string | null;
  isRotation: boolean;
};

function mockLiveStreams(): AdminLiveStreamRow[] {
  return [
    {
      slug: 'northern-lights',
      artistName: 'Northern Lights',
      username: 'northern-lights',
      elapsedSec: 5400,
      goneLiveAt: '2026-08-16T20:00:00.000Z',
      hlsUrl: 'https://stream.tahti.live/northern-lights/stream.m3u8',
      isRotation: false,
    },
    {
      slug: 'dj-moonlight',
      artistName: 'DJ Moonlight',
      username: 'dj-moonlight',
      elapsedSec: 1860,
      goneLiveAt: '2026-08-17T00:39:00.000Z',
      hlsUrl: 'https://stream.tahti.live/dj-moonlight/stream.m3u8',
      isRotation: false,
    },
  ];
}

export async function fetchAdminStreams(): Promise<{
  data: AdminLiveStreamRow[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockLiveStreams(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ streams: AdminLiveStreamRow[] }>(
      '/api/admin/streams',
    );
    return { data: data.streams, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function restartStream(slug: string) {
  if (forceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/streams/${encodeURIComponent(slug)}/restart`,
    'POST',
  );
}

export function skipStreamTrack(slug: string) {
  if (forceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(`/api/admin/streams/${encodeURIComponent(slug)}/skip`, 'POST');
}

export function pauseStream(slug: string) {
  if (forceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(`/api/admin/streams/${encodeURIComponent(slug)}/pause`, 'POST');
}

export function resumeStream(slug: string) {
  if (forceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/streams/${encodeURIComponent(slug)}/resume`,
    'POST',
  );
}

export function forceStreamOffline(slug: string) {
  if (forceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/streams/${encodeURIComponent(slug)}/force-offline`,
    'POST',
  );
}

// ── Support ─────────────────────────────────────────────────────────────────

export type AdminSupportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export type AdminSupportTicket = {
  id: string;
  subject: string;
  category: string;
  status: AdminSupportStatus;
  artistUsername: string | null;
  contactEmail: string | null;
  createdAt: string;
};

function mockSupportTickets(): AdminSupportTicket[] {
  return [
    {
      id: 'tkt-1',
      subject: 'Cannot connect OBS to multistream target',
      category: 'broadcast',
      status: 'OPEN',
      artistUsername: 'dj-moonlight',
      contactEmail: null,
      createdAt: '2026-08-16T10:00:00.000Z',
    },
    {
      id: 'tkt-2',
      subject: 'Payout never arrived',
      category: 'billing',
      status: 'IN_PROGRESS',
      artistUsername: 'midnight-cartography',
      contactEmail: null,
      createdAt: '2026-08-15T09:00:00.000Z',
    },
    {
      id: 'tkt-3',
      subject: 'How do I change my channel URL?',
      category: 'general',
      status: 'RESOLVED',
      artistUsername: null,
      contactEmail: 'listener@example.com',
      createdAt: '2026-08-10T09:00:00.000Z',
    },
  ];
}

export async function fetchAdminSupportTickets(
  status?: AdminSupportStatus,
): Promise<{ data: AdminSupportTicket[]; meta: FetchMeta }> {
  if (forceMock()) {
    const all = mockSupportTickets();
    return {
      data: status ? all.filter((t) => t.status === status) : all,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const qs = new URLSearchParams({ limit: '50' });
    if (status) {
      qs.set('status', status);
    }
    const data = await getJson<{ tickets: AdminSupportTicket[] }>(
      `/api/admin/support/tickets?${qs.toString()}`,
    );
    return { data: data.tickets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

// ── Top lists ───────────────────────────────────────────────────────────────

export type AdminTopListPeriod = 'month' | 'half_year' | 'all_time';
export type AdminTopListDimension = 'type' | 'genre';
export type AdminTopListSort = 'desc' | 'asc';

export type AdminTopListEntry = {
  archiveItemId: string;
  listens: number;
  title: string;
  artistName: string;
  channelSlug: string;
  audioUrl?: string | null;
};

export type AdminTopListBucket = {
  bucket: string;
  entries: AdminTopListEntry[];
};

function mockTopLists(dimension: AdminTopListDimension): AdminTopListBucket[] {
  const tracks = [
    {
      title: 'Moonlight Drive',
      artistName: 'DJ Moonlight',
      channelSlug: 'dj-moonlight',
      listens: 842,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
      title: 'Route 550',
      artistName: 'Midnight Cartography',
      channelSlug: 'midnight-cartography',
      listens: 611,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    },
    {
      title: 'Aurora Drift',
      artistName: 'Northern Lights',
      channelSlug: 'northern-lights',
      listens: 590,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    },
    {
      title: 'Echo Chamber Cypher',
      artistName: 'Kaiku Collective',
      channelSlug: 'kaiku-collective',
      listens: 401,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
  ];
  const bucketed =
    dimension === 'type'
      ? [
          { bucket: 'Live sets', entries: tracks.slice(0, 2) },
          { bucket: 'Archive tracks', entries: tracks.slice(2) },
        ]
      : [
          { bucket: 'Electronic', entries: tracks.slice(0, 2) },
          { bucket: 'Downtempo', entries: [tracks[1]!] },
          { bucket: 'Hip-hop', entries: [tracks[3]!] },
        ];
  return bucketed.map((b) => ({
    bucket: b.bucket,
    entries: b.entries.map((t, i) => ({
      archiveItemId: `${b.bucket}-${i}`,
      listens: t.listens,
      title: t.title,
      artistName: t.artistName,
      channelSlug: t.channelSlug,
      audioUrl: t.audioUrl,
    })),
  }));
}

export async function fetchAdminTopLists(
  period: AdminTopListPeriod,
  dimension: AdminTopListDimension,
  sort: AdminTopListSort,
): Promise<{ data: AdminTopListBucket[]; meta: FetchMeta }> {
  if (forceMock()) {
    const buckets = mockTopLists(dimension).map((b) => ({
      bucket: b.bucket,
      entries: [...b.entries].sort((a, c) =>
        sort === 'desc' ? c.listens - a.listens : a.listens - c.listens,
      ),
    }));
    return {
      data: buckets,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ buckets: AdminTopListBucket[] }>(
      `/api/admin/top-lists?period=${period}&dimension=${dimension}&sort=${sort}`,
    );
    return { data: data.buckets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

// ── Announcements ───────────────────────────────────────────────────────────

export type AdminAnnouncementScheduleMode =
  | 'AFTER_EVERY'
  | 'EVERY_NTH'
  | 'RANDOM';

export type AdminAnnouncementClip = {
  id: string;
  title: string;
  durationSec: number | null;
  isEnabled: boolean;
  scheduleMode: AdminAnnouncementScheduleMode;
  everyNth: number | null;
  audioUrl?: string | null;
};

let mockAnnouncementClips: AdminAnnouncementClip[] | null = null;
let mockAnnouncementsSystemEnabled = true;

function announcementState(): AdminAnnouncementClip[] {
  if (!mockAnnouncementClips) {
    mockAnnouncementClips = [
      {
        id: 'ann-1',
        title: 'Welcome to Tahti',
        durationSec: 12,
        isEnabled: true,
        scheduleMode: 'AFTER_EVERY',
        everyNth: null,
        audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      },
      {
        id: 'ann-2',
        title: 'AGM reminder — October',
        durationSec: 8,
        isEnabled: false,
        scheduleMode: 'EVERY_NTH',
        everyNth: 6,
        audioUrl: null,
      },
    ];
  }
  return mockAnnouncementClips;
}

export async function fetchAdminAnnouncements(): Promise<{
  data: { clips: AdminAnnouncementClip[]; systemEnabled: boolean };
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: {
        clips: announcementState(),
        systemEnabled: mockAnnouncementsSystemEnabled,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{
      clips: AdminAnnouncementClip[];
      systemEnabled: boolean;
    }>('/api/admin/announcements');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: { clips: [], systemEnabled: false },
      meta: failMeta(err),
    };
  }
}

export function setAnnouncementsSystemEnabled(enabled: boolean) {
  if (forceMock()) {
    mockAnnouncementsSystemEnabled = enabled;
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/announcements/system-enabled', 'PATCH', {
    enabled,
  });
}

export async function patchAnnouncementClip(
  id: string,
  patch: Partial<
    Pick<AdminAnnouncementClip, 'isEnabled' | 'scheduleMode' | 'everyNth'>
  >,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    const clip = announcementState().find((c) => c.id === id);
    if (clip) {
      Object.assign(clip, patch);
    }
    return { ok: true };
  }
  return mutate(
    `/api/admin/announcements/${encodeURIComponent(id)}`,
    'PATCH',
    patch,
  );
}

export function deleteAnnouncementClip(id: string) {
  if (forceMock()) {
    mockAnnouncementClips = announcementState().filter((c) => c.id !== id);
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(`/api/admin/announcements/${encodeURIComponent(id)}`, 'DELETE');
}

export async function uploadAnnouncementClip(
  file: File,
): Promise<
  { ok: true; clip: AdminAnnouncementClip } | { ok: false; error: string }
> {
  const title = file.name.replace(/\.[^.]+$/, '');
  if (forceMock()) {
    const clip: AdminAnnouncementClip = {
      id: `ann-${Date.now()}`,
      title,
      durationSec: null,
      isEnabled: true,
      scheduleMode: 'AFTER_EVERY',
      everyNth: null,
      audioUrl: null,
    };
    announcementState().unshift(clip);
    return { ok: true, clip };
  }
  try {
    const prep = await sendJson<{ objectKey: string; uploadUrl: string }>(
      '/api/admin/announcements/prepare',
      'POST',
      { filename: file.name, contentType: file.type, sizeBytes: file.size },
    );
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!put.ok) {
      return { ok: false, error: `Upload failed (${put.status})` };
    }
    const clip = await sendJson<AdminAnnouncementClip>(
      '/api/admin/announcements',
      'POST',
      { objectKey: prep.objectKey, title },
    );
    return { ok: true, clip };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

// ── Storage ─────────────────────────────────────────────────────────────────

export type AdminStorageUserRow = {
  userId: string;
  username: string;
  displayName: string;
  quotaBytes: number;
  usedBytes: number;
};

export type AdminStorageOverview = {
  totalQuotaBytes: number;
  totalUsedBytes: number;
  userCount: number;
  users: AdminStorageUserRow[];
};

function mockStorageOverview(): AdminStorageOverview {
  const users: AdminStorageUserRow[] = [
    {
      userId: 'u-1',
      username: 'dj-moonlight',
      displayName: 'DJ Moonlight',
      quotaBytes: 500 * 1024 * 1024,
      usedBytes: 412 * 1024 * 1024,
    },
    {
      userId: 'u-2',
      username: 'midnight-cartography',
      displayName: 'Midnight Cartography',
      quotaBytes: 500 * 1024 * 1024,
      usedBytes: 538 * 1024 * 1024,
    },
    {
      userId: 'u-3',
      username: 'kaiku-collective',
      displayName: 'Kaiku Collective',
      quotaBytes: 1024 * 1024 * 1024,
      usedBytes: 201 * 1024 * 1024,
    },
    {
      userId: 'u-4',
      username: 'northern-lights',
      displayName: 'Northern Lights',
      quotaBytes: 500 * 1024 * 1024,
      usedBytes: 89 * 1024 * 1024,
    },
  ];
  return {
    totalQuotaBytes: users.reduce((s, u) => s + u.quotaBytes, 0),
    totalUsedBytes: users.reduce((s, u) => s + u.usedBytes, 0),
    userCount: users.length,
    users,
  };
}

let mockStorageState: AdminStorageOverview | null = null;

export async function fetchAdminStorage(): Promise<{
  data: AdminStorageOverview | null;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    if (!mockStorageState) {
      mockStorageState = mockStorageOverview();
    }
    return {
      data: mockStorageState,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminStorageOverview>('/api/admin/storage');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export function setUserStorageQuota(userId: string, quotaBytes: number) {
  if (forceMock()) {
    const row = mockStorageState?.users.find((u) => u.userId === userId);
    if (row) {
      row.quotaBytes = quotaBytes;
    }
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/storage/${encodeURIComponent(userId)}/quota`,
    'PATCH',
    {
      quotaBytes,
    },
  );
}

// ── Files ───────────────────────────────────────────────────────────────────

export type AdminFileRow = {
  id: string;
  title: string;
  artistName: string;
  genre: string | null;
  contentType: string;
  isPublic: boolean;
  durationSec: number | null;
  createdAt: string;
  channelSlug: string;
  username: string;
  audioUrl: string | null;
};

function mockAdminFiles(): AdminFileRow[] {
  return [
    {
      id: 'file-1',
      title: 'Moonlight Drive',
      artistName: 'DJ Moonlight',
      genre: 'Downtempo',
      contentType: 'TRACK',
      isPublic: true,
      durationSec: 312,
      createdAt: '2026-08-10T12:00:00.000Z',
      channelSlug: 'dj-moonlight',
      username: 'dj-moonlight',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
      id: 'file-2',
      title: 'Route 550 (live set)',
      artistName: 'Midnight Cartography',
      genre: 'Electronic',
      contentType: 'LIVE_SET',
      isPublic: true,
      durationSec: 3480,
      createdAt: '2026-08-09T18:00:00.000Z',
      channelSlug: 'midnight-cartography',
      username: 'midnight-cartography',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    },
    {
      id: 'file-3',
      title: 'Echo Chamber Cypher',
      artistName: 'Kaiku Collective',
      genre: 'Hip-hop',
      contentType: 'TRACK',
      isPublic: false,
      durationSec: 201,
      createdAt: '2026-08-05T09:00:00.000Z',
      channelSlug: 'kaiku-collective',
      username: 'kaiku-collective',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
    {
      id: 'file-4',
      title: 'Aurora Drift (unmastered)',
      artistName: 'Northern Lights',
      genre: null,
      contentType: 'STASH',
      isPublic: false,
      durationSec: 279,
      createdAt: '2026-08-01T09:00:00.000Z',
      channelSlug: 'northern-lights',
      username: 'northern-lights',
      audioUrl: null,
    },
  ];
}

let mockAdminFilesState: AdminFileRow[] | null = null;

export async function fetchAdminFiles(query?: string): Promise<{
  data: AdminFileRow[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    if (!mockAdminFilesState) {
      mockAdminFilesState = mockAdminFiles();
    }
    const q = query?.trim().toLowerCase();
    const data = q
      ? mockAdminFilesState.filter(
          (f) =>
            f.title.toLowerCase().includes(q) ||
            f.artistName.toLowerCase().includes(q) ||
            f.username.toLowerCase().includes(q),
        )
      : mockAdminFilesState;
    return { data, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const qs = new URLSearchParams({ limit: '50' });
    if (query?.trim()) {
      qs.set('q', query.trim());
    }
    const data = await getJson<{ items: AdminFileRow[] }>(
      `/api/admin/files?${qs.toString()}`,
    );
    return { data: data.items, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function deleteAdminFile(id: string) {
  if (forceMock()) {
    mockAdminFilesState = (mockAdminFilesState ?? mockAdminFiles()).filter(
      (f) => f.id !== id,
    );
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(`/api/admin/files/${encodeURIComponent(id)}`, 'DELETE');
}

// ── Content reports ─────────────────────────────────────────────────────────

export type AdminContentReportStatus =
  | 'OPEN'
  | 'REVIEWING'
  | 'ACTIONED'
  | 'DISMISSED';

export type AdminContentReportRow = {
  id: string;
  targetType:
    | 'ARCHIVE_ITEM'
    | 'RELEASE'
    | 'CHANNEL'
    | 'COLLECTION'
    | 'MOTION_COMMENT';
  targetId: string;
  reason: 'COPYRIGHT' | 'HARASSMENT' | 'SPAM' | 'ILLEGAL_CONTENT' | 'OTHER';
  details: string | null;
  status: AdminContentReportStatus;
  resolvedByDisplayName: string | null;
  resolutionNote: string | null;
  createdAt: string;
};

function mockContentReports(): AdminContentReportRow[] {
  return [
    {
      id: 'rep-1',
      targetType: 'ARCHIVE_ITEM',
      targetId: 'arch-sub-1',
      reason: 'COPYRIGHT',
      details: 'Uses an unlicensed sample around 1:40.',
      status: 'OPEN',
      resolvedByDisplayName: null,
      resolutionNote: null,
      createdAt: '2026-08-15T14:00:00.000Z',
    },
    {
      id: 'rep-2',
      targetType: 'CHANNEL',
      targetId: 'kaiku-collective',
      reason: 'SPAM',
      details: null,
      status: 'REVIEWING',
      resolvedByDisplayName: null,
      resolutionNote: null,
      createdAt: '2026-08-14T11:00:00.000Z',
    },
    {
      id: 'rep-3',
      targetType: 'MOTION_COMMENT',
      targetId: 'motion-3-comment-9',
      reason: 'HARASSMENT',
      details: 'Personal attack in the comment thread.',
      status: 'ACTIONED',
      resolvedByDisplayName: 'Board — Aino',
      resolutionNote: 'Comment removed, member warned.',
      createdAt: '2026-08-10T08:00:00.000Z',
    },
  ];
}

let mockContentReportsState: AdminContentReportRow[] | null = null;

export async function fetchAdminContentReports(
  status?: AdminContentReportStatus,
): Promise<{ data: AdminContentReportRow[]; meta: FetchMeta }> {
  if (forceMock()) {
    if (!mockContentReportsState) {
      mockContentReportsState = mockContentReports();
    }
    const data = status
      ? mockContentReportsState.filter((r) => r.status === status)
      : mockContentReportsState;
    return { data, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const qs = new URLSearchParams({ limit: '50' });
    if (status) {
      qs.set('status', status);
    }
    const data = await getJson<{ reports: AdminContentReportRow[] }>(
      `/api/admin/content-reports?${qs.toString()}`,
    );
    return { data: data.reports, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function resolveContentReport(
  id: string,
  status: 'REVIEWING' | 'ACTIONED' | 'DISMISSED',
  note?: string,
) {
  if (forceMock()) {
    const row = (mockContentReportsState ?? mockContentReports()).find(
      (r) => r.id === id,
    );
    if (row) {
      row.status = status;
      row.resolutionNote = note ?? row.resolutionNote;
      row.resolvedByDisplayName = 'You';
    }
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/content-reports/${encodeURIComponent(id)}`,
    'PATCH',
    {
      status,
      resolutionNote: note,
    },
  );
}

// ── Financial ───────────────────────────────────────────────────────────────

export type AdminLedgerEntry = {
  id: string;
  category: string;
  amountCents: number;
  description: string;
  createdAt: string;
};

export type AdminFinancialOverview = {
  entries: AdminLedgerEntry[];
  activeFanSubCount: number;
  mrrCents: number;
  pendingPayouts: { count: number; totalNetCents: number };
  failedPayouts: { count: number; totalNetCents: number };
};

export const LEDGER_CATEGORIES = [
  'REVENUE_SUBSCRIPTION',
  'REVENUE_DISTRIBUTION',
  'REVENUE_GRANT_INBOUND',
  'REVENUE_DONATION',
  'COST_INFRASTRUCTURE',
  'COST_DISTRIBUTION_PASSTHROUGH',
  'COST_OPERATIONS',
  'COST_SALARY',
  'COST_AUDIT',
  'COST_PROFESSIONAL_SERVICES',
  'GRANT_DISBURSEMENT',
  'RESERVE_TRANSFER',
] as const;

function mockFinancialOverview(): AdminFinancialOverview {
  return {
    entries: [
      {
        id: 'ledg-1',
        category: 'REVENUE_SUBSCRIPTION',
        amountCents: 48200,
        description: 'Fan subscriptions — July settlement',
        createdAt: '2026-08-02T09:00:00.000Z',
      },
      {
        id: 'ledg-2',
        category: 'COST_INFRASTRUCTURE',
        amountCents: -21500,
        description: 'UpCloud + fiber — August',
        createdAt: '2026-08-01T09:00:00.000Z',
      },
      {
        id: 'ledg-3',
        category: 'COST_SALARY',
        amountCents: -180000,
        description: 'Ops contractor — August',
        createdAt: '2026-08-01T09:00:00.000Z',
      },
      {
        id: 'ledg-4',
        category: 'REVENUE_DONATION',
        amountCents: 12000,
        description: 'Member donation drive',
        createdAt: '2026-07-28T09:00:00.000Z',
      },
    ],
    activeFanSubCount: 214,
    mrrCents: 482000,
    pendingPayouts: { count: 3, totalNetCents: 61200 },
    failedPayouts: { count: 1, totalNetCents: 4200 },
  };
}

let mockFinancialState: AdminFinancialOverview | null = null;

export async function fetchAdminFinancial(): Promise<{
  data: AdminFinancialOverview | null;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    if (!mockFinancialState) {
      mockFinancialState = mockFinancialOverview();
    }
    return {
      data: mockFinancialState,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const [ledgerRes, fansubsRes] = await Promise.all([
      getJson<AdminLedgerEntry[]>(
        `/api/admin/ledger?year=${new Date().getUTCFullYear()}`,
      ),
      getJson<{
        activeFanSubCount: number;
        mrrCents: number;
        pendingPayouts: { count: number; totalNetCents: number };
        failedPayouts: { count: number; totalNetCents: number };
      }>('/api/admin/fansubs/overview'),
    ]);
    return {
      data: { entries: ledgerRes, ...fansubsRes },
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export function createLedgerEntry(entry: {
  category: string;
  amountCents: number;
  description: string;
}) {
  if (forceMock()) {
    const row: AdminLedgerEntry = {
      id: `ledg-${Date.now()}`,
      ...entry,
      createdAt: new Date().toISOString(),
    };
    (mockFinancialState ?? mockFinancialOverview()).entries.unshift(row);
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/ledger', 'POST', entry);
}

// ── Governance ──────────────────────────────────────────────────────────────

export type AdminGovernanceOverview = {
  openMotions: number;
  pendingVenueVerifications: number;
  lastAnnualReportYear: number | null;
  boardResolutionsThisYear: number;
};

function mockGovernanceOverview(): AdminGovernanceOverview {
  return {
    openMotions: 2,
    pendingVenueVerifications: 5,
    lastAnnualReportYear: 2025,
    boardResolutionsThisYear: 7,
  };
}

export async function fetchAdminGovernanceOverview(): Promise<{
  data: AdminGovernanceOverview;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockGovernanceOverview(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminGovernanceOverview>(
      '/api/admin/governance/overview',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: mockGovernanceOverview(), meta: failMeta(err) };
  }
}

// ── Feature requests ────────────────────────────────────────────────────────

export type AdminFeatureRequestStatus =
  | 'OPEN'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'DECLINED'
  | 'DUPLICATE';

export type AdminFeatureRequestRow = {
  id: string;
  title: string;
  description: string;
  status: AdminFeatureRequestStatus;
  proposerDisplayName: string;
  proposerUsername: string;
  voteCount: number;
  reviewNote: string | null;
  createdAt: string;
};

function mockFeatureRequests(): AdminFeatureRequestRow[] {
  return [
    {
      id: 'fr-1',
      title: 'Crossfade between archive tracks',
      description: 'Smooth transition when auto-advancing the queue.',
      status: 'OPEN',
      proposerDisplayName: 'DJ Moonlight',
      proposerUsername: 'dj-moonlight',
      voteCount: 34,
      reviewNote: null,
      createdAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'fr-2',
      title: 'Bulk-tag archive items',
      description: 'Select multiple tracks and apply a genre/tag at once.',
      status: 'PLANNED',
      proposerDisplayName: 'Northern Lights',
      proposerUsername: 'northern-lights',
      voteCount: 21,
      reviewNote: 'Slated for the next archive sprint.',
      createdAt: '2026-07-20T10:00:00.000Z',
    },
    {
      id: 'fr-3',
      title: 'Dark-mode-only theme toggle',
      description: null as unknown as string,
      status: 'DONE',
      proposerDisplayName: 'Kaiku Collective',
      proposerUsername: 'kaiku-collective',
      voteCount: 12,
      reviewNote: 'Shipped in themes settings.',
      createdAt: '2026-06-15T10:00:00.000Z',
    },
  ];
}

let mockFeatureRequestsState: AdminFeatureRequestRow[] | null = null;

export async function fetchAdminFeatureRequests(
  status?: AdminFeatureRequestStatus,
): Promise<{ data: AdminFeatureRequestRow[]; meta: FetchMeta }> {
  if (forceMock()) {
    if (!mockFeatureRequestsState) {
      mockFeatureRequestsState = mockFeatureRequests();
    }
    const data = status
      ? mockFeatureRequestsState.filter((r) => r.status === status)
      : mockFeatureRequestsState;
    return { data, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const qs = status ? `?status=${status}` : '';
    const data = await getJson<AdminFeatureRequestRow[]>(
      `/api/admin/feature-requests${qs}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function updateFeatureRequestStatus(
  id: string,
  status: AdminFeatureRequestStatus,
  note?: string,
) {
  if (forceMock()) {
    const row = (mockFeatureRequestsState ?? mockFeatureRequests()).find(
      (r) => r.id === id,
    );
    if (row) {
      row.status = status;
      row.reviewNote = note ?? row.reviewNote;
    }
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/feature-requests/${encodeURIComponent(id)}`,
    'PATCH',
    {
      status,
      reviewNote: note,
    },
  );
}

// ── Grants ──────────────────────────────────────────────────────────────────

export type AdminGrantYearSummary = {
  year: number;
  grantCount: number;
  totalCents: number;
};

function mockGrantHistory(): AdminGrantYearSummary[] {
  const year = new Date().getUTCFullYear();
  return [
    { year: year - 1, grantCount: 18, totalCents: 940000 },
    { year: year - 2, grantCount: 14, totalCents: 710000 },
  ];
}

export async function fetchAdminGrants(): Promise<{
  data: AdminGrantYearSummary[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockGrantHistory(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const currentYear = new Date().getUTCFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const results = await Promise.all(
      years.map(async (year) => {
        try {
          const data = await getJson<{
            year: number;
            grantCount: number;
            totalCents: number;
          }>(`/api/v1/transparency/grants/${year}`);
          return data.grantCount > 0 ? data : null;
        } catch {
          return null;
        }
      }),
    );
    return {
      data: results.filter((r): r is AdminGrantYearSummary => r !== null),
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

// ── AGM ─────────────────────────────────────────────────────────────────────

export type AdminMotion = {
  id: string;
  title: string;
  state: 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
  advisory: boolean;
  openAt: string;
  closeAt: string;
  totalVotes: number;
};

function mockAgmMotions(): AdminMotion[] {
  return [
    {
      id: 'motion-1',
      title: 'Adopt updated code of conduct',
      state: 'OPEN',
      advisory: true,
      openAt: '2026-08-10T00:00:00.000Z',
      closeAt: '2026-08-24T00:00:00.000Z',
      totalVotes: 58,
    },
    {
      id: 'motion-2',
      title: 'Raise fan-sub artist payout share to 92%',
      state: 'DRAFT',
      advisory: false,
      openAt: '2026-08-20T00:00:00.000Z',
      closeAt: '2026-09-03T00:00:00.000Z',
      totalVotes: 0,
    },
  ];
}

export async function fetchAdminAgmMotions(): Promise<{
  data: AdminMotion[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockAgmMotions(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminMotion[]>('/api/v1/governance/motions');
    return {
      data: data.filter((m) => m.state === 'OPEN' || m.state === 'DRAFT'),
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

// ── Vendors ─────────────────────────────────────────────────────────────────

export type AdminIntegrationStatus = {
  name: string;
  live: boolean;
  detail: string;
};

function mockIntegrationStatus(): AdminIntegrationStatus[] {
  return [
    { name: 'Mixcloud', live: true, detail: 'Archive uploads connected' },
    { name: 'Revelator', live: false, detail: 'Stub mode — API key not set' },
  ];
}

export async function fetchAdminIntegrationStatus(): Promise<{
  data: AdminIntegrationStatus[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockIntegrationStatus(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ integrations: AdminIntegrationStatus[] }>(
      '/api/admin/integrations',
    );
    return { data: data.integrations, meta: { source: 'api' } };
  } catch (err) {
    return { data: mockIntegrationStatus(), meta: failMeta(err) };
  }
}

// ── Status ──────────────────────────────────────────────────────────────────

export type AdminStatusCheck = {
  state: 'up' | 'down';
  critical: boolean;
  latencyMs?: number;
  detail?: string;
};

export type AdminStatusData = {
  status: string;
  uptimeSec: number;
  checks: Record<string, AdminStatusCheck>;
  ts: string;
};

function mockStatusData(): AdminStatusData {
  return {
    status: 'operational',
    uptimeSec: 60 * 60 * 118,
    ts: new Date().toISOString(),
    checks: {
      api: { state: 'up', critical: true, latencyMs: 42 },
      postgres: { state: 'up', critical: true, latencyMs: 6 },
      icecast: { state: 'up', critical: true, latencyMs: 18 },
      minio: { state: 'up', critical: true, latencyMs: 9 },
      redis: { state: 'up', critical: false, latencyMs: 3 },
      email: {
        state: 'up',
        critical: false,
        detail: 'Postmark bounce webhook responsive',
      },
    },
  };
}

export async function fetchAdminStatus(): Promise<{
  data: AdminStatusData | null;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockStatusData(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminStatusData>('/api/v1/status');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

// ── i18n / Languages ─────────────────────────────────────────────────────

export type AdminLanguage = {
  code: string;
  name: string;
  translatedKeys: number;
  totalKeys: number;
  isDefault: boolean;
  updatedAt: string;
};

const BASE_KEY_COUNT = 812;

let mockLanguagesState: AdminLanguage[] | null = null;

function mockLanguages(): AdminLanguage[] {
  if (!mockLanguagesState) {
    mockLanguagesState = [
      {
        code: 'en',
        name: 'English',
        translatedKeys: BASE_KEY_COUNT,
        totalKeys: BASE_KEY_COUNT,
        isDefault: true,
        updatedAt: '2026-01-10T09:00:00.000Z',
      },
      {
        code: 'fi',
        name: 'Finnish',
        translatedKeys: BASE_KEY_COUNT,
        totalKeys: BASE_KEY_COUNT,
        isDefault: false,
        updatedAt: '2026-03-02T09:00:00.000Z',
      },
      {
        code: 'sv',
        name: 'Swedish',
        translatedKeys: 214,
        totalKeys: BASE_KEY_COUNT,
        isDefault: false,
        updatedAt: '2026-06-18T09:00:00.000Z',
      },
    ];
  }
  return mockLanguagesState;
}

export async function fetchAdminLanguages(): Promise<{
  data: AdminLanguage[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockLanguages(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ languages: AdminLanguage[] }>(
      '/api/admin/i18n/languages',
    );
    return { data: data.languages, meta: { source: 'api' } };
  } catch (err) {
    return { data: mockLanguages(), meta: failMeta(err) };
  }
}

export async function createAdminLanguage(input: {
  code: string;
  name: string;
}): Promise<{ ok: true; data: AdminLanguage } | { ok: false; error: string }> {
  if (forceMock()) {
    if (mockLanguages().some((l) => l.code === input.code)) {
      return { ok: false, error: `Language "${input.code}" already exists.` };
    }
    const lang: AdminLanguage = {
      code: input.code,
      name: input.name,
      translatedKeys: 0,
      totalKeys: BASE_KEY_COUNT,
      isDefault: false,
      updatedAt: new Date().toISOString(),
    };
    mockLanguagesState = [...mockLanguages(), lang];
    return { ok: true, data: lang };
  }
  try {
    const data = await sendJson<AdminLanguage>(
      '/api/admin/i18n/languages',
      'POST',
      input,
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

export type AdminLanguageImportResult = { imported: number; skipped: number };

/** CSV is expected as `english,translation` (optionally `key,english,translation`)
 * with an optional header row — the source/base column is always English. */
export async function importAdminLanguageCsv(
  code: string,
  file: File,
): Promise<
  { ok: true; data: AdminLanguageImportResult } | { ok: false; error: string }
> {
  const text = await file.text();
  const rows = text.split(/\r?\n/).filter((r) => r.trim().length > 0);
  const looksLikeHeader = /english|^key,|^en,/i.test(rows[0] ?? '');
  const dataRows = looksLikeHeader ? rows.slice(1) : rows;
  const validRows = dataRows.filter((r) => {
    const cols = r.split(',');
    return cols.length >= 2 && cols[cols.length - 1]?.trim();
  });
  const result: AdminLanguageImportResult = {
    imported: validRows.length,
    skipped: dataRows.length - validRows.length,
  };

  if (forceMock()) {
    const lang = mockLanguages().find((l) => l.code === code);
    if (!lang) {
      return { ok: false, error: `Unknown language "${code}".` };
    }
    lang.translatedKeys = Math.min(
      lang.totalKeys,
      lang.translatedKeys + result.imported,
    );
    lang.updatedAt = new Date().toISOString();
    return { ok: true, data: result };
  }
  try {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(
      `${apiBase()}/api/admin/i18n/languages/${encodeURIComponent(code)}/import`,
      { method: 'POST', credentials: 'include', body: form },
    );
    if (!res.ok) {
      throw new Error(`import → ${res.status}`);
    }
    const data = (await res.json()) as AdminLanguageImportResult;
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Import failed',
    };
  }
}
