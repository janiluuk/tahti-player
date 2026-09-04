import { getAccountRole } from '../lib/accountRoles';
import type { FetchMeta } from './client';
import {
  createMockInternetRadioPreset,
  deleteMockInternetRadioPreset,
  listMockInternetRadioPresets,
  patchMockInternetRadioPreset,
} from './internetRadioPresetsMockStore';
import { listMockCommerceAudit } from './mock-commerce-ledger';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';
import type {
  AccountRole,
  BoardResolution,
  GovernanceDocument,
  GovernanceMeeting,
} from './types';

const forceMock = isForceMock;

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

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

export type AdminVenue = {
  id: string;
  slug: string;
  name: string;
  city: string;
  countryCode: string;
  verifiedAt: string | null;
  createdAt: string;
  createdBy: string;
};

export async function fetchAdminVenues(): Promise<{
  data: AdminVenue[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [
        {
          id: 'venue-admin-mock-1',
          slug: 'northern-lights-hall',
          name: 'Northern Lights Hall',
          city: 'Helsinki',
          countryCode: 'FI',
          verifiedAt: '2026-06-01T00:00:00.000Z',
          createdAt: '2026-05-20T00:00:00.000Z',
          createdBy: 'artist@example.test',
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    return {
      data: await getJson<AdminVenue[]>('/api/admin/venues'),
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function setAdminVenueVerification(
  slug: string,
  verified: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return mutate(
    `/api/admin/venues/${encodeURIComponent(slug)}/${verified ? 'verify' : 'unverify'}`,
    'POST',
  );
}

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

export type AdminContentOverview = {
  counts: {
    tracks: number;
    shows: number;
    uploads: number;
    listens: number;
  };
  latestContent: Array<{
    id: string;
    title: string;
    type: string;
    artistName?: string | null;
    createdAt: string;
  }>;
  latestBroadcasts: Array<{
    id: string;
    title: string;
    artistName?: string | null;
    recordedAt: string;
    durationSec?: number | null;
    soundId?: string | null;
  }>;
};

function mockContentOverview(): AdminContentOverview {
  return {
    counts: { tracks: 1842, shows: 318, uploads: 2675, listens: 48216 },
    latestContent: [
      {
        id: 'content-1',
        title: 'Northern Lights — Live Set',
        type: 'DJ Set',
        artistName: 'Northern Lights',
        createdAt: '2026-08-28T09:30:00.000Z',
      },
      {
        id: 'content-2',
        title: 'Blue Hour',
        type: 'Track',
        artistName: 'Northern Lights',
        createdAt: '2026-08-27T18:10:00.000Z',
      },
      {
        id: 'content-3',
        title: 'Saimaa Sessions',
        type: 'Show',
        artistName: 'Kaiku Collective',
        createdAt: '2026-08-27T14:40:00.000Z',
      },
      {
        id: 'content-4',
        title: 'Field Notes Vol. 2',
        type: 'Release',
        artistName: 'Moss Archive',
        createdAt: '2026-08-26T11:15:00.000Z',
      },
    ],
    latestBroadcasts: [
      {
        id: 'broadcast-1',
        title: 'Late-night broadcast',
        artistName: 'DJ Moonlight',
        recordedAt: '2026-08-28T01:20:00.000Z',
        durationSec: 6840,
        soundId: 'arch-mock-1',
      },
      {
        id: 'broadcast-2',
        title: 'Boathouse Sessions',
        artistName: 'Kaiku Collective',
        recordedAt: '2026-08-27T20:00:00.000Z',
        durationSec: 4920,
        soundId: 'arch-mock-3',
      },
      {
        id: 'broadcast-3',
        title: 'Ring Rail after dark',
        artistName: 'Moss Archive',
        recordedAt: '2026-08-26T22:15:00.000Z',
        durationSec: 3780,
        soundId: null,
      },
    ],
  };
}

export async function fetchAdminContentOverview(): Promise<{
  data: AdminContentOverview;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockContentOverview(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminContentOverview>(
      '/api/admin/stats/content',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockContentOverview(), meta: failMeta(err) };
    }
    return {
      data: {
        counts: { tracks: 0, shows: 0, uploads: 0, listens: 0 },
        latestContent: [],
        latestBroadcasts: [],
      },
      meta: apiErrorMeta(err),
    };
  }
}

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
    if (allowMockFallback()) {
      return { data: mockDashboard(), meta: failMeta(err) };
    }
    return {
      data: {
        kpis: { activeMembers: 0, liveNow: 0, betaQueue: 0, openTickets: 0 },
        actionRows: [],
        health: {
          icecast: 'down',
          minio: 'down',
          postgresBackupAgeHours: null,
          failedFanSubPayouts: 0,
        },
        financeYtdCents: { surplus: 0, revenue: 0, costs: 0 },
        liveStreams: [],
        queues: [],
        cronJobs: [],
        audit: [],
      },
      meta: apiErrorMeta(err),
    };
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

export type AdminRadioRotationItem = {
  id: string;
  title: string;
  artistName: string;
  durationSec: number | null;
  soundId: string;
  audioUrl?: string | null;
  channelSlug: string;
  license: string;
  addedBy: string;
};

const mockRadioRotation: AdminRadioRotationItem[] = [
  {
    id: 'radio-rotation-1',
    soundId: 'radio-archive-1',
    title: 'Night Transit',
    artistName: 'Tahti Radio submissions',
    durationSec: 288,
    channelSlug: 'tahti-radio',
    license: 'CC_BY',
    addedBy: 'radio-editorial',
  },
  {
    id: 'radio-rotation-2',
    soundId: 'radio-archive-2',
    title: 'Signal Bloom',
    artistName: 'Tahti Radio submissions',
    durationSec: 346,
    channelSlug: 'tahti-radio',
    license: 'CC_BY_SA',
    addedBy: 'radio-editorial',
  },
];

export async function fetchAdminRadioRotation(): Promise<{
  data: AdminRadioRotationItem[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockRadioRotation,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<
      Array<{
        id: string;
        title: string;
        artistName: string;
        durationSec?: number | null;
        artistUsername?: string | null;
      }>
    >('/api/v1/radio/rotation');
    return {
      data: data.map((item) => ({
        ...item,
        soundId: item.id,
        durationSec: item.durationSec ?? null,
        channelSlug: item.artistUsername ?? 'tahti-radio',
        license: '',
        addedBy: 'radio-editorial',
      })),
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

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
    if (allowMockFallback()) {
      return { data: mockRadioAdmin(), meta: failMeta(err) };
    }
    return {
      data: {
        nowPlaying: { live: false, slug: null, artistName: null },
        eligible: [],
        history: [],
        optedOut: [],
      },
      meta: apiErrorMeta(err),
    };
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

// ── Internet radio presets (Listen page defaults) ───────────────────────────

export type AdminInternetRadioPreset = {
  id: string;
  name: string;
  genre: string | null;
  description: string | null;
  iconUrl: string | null;
  programmingUrl: string | null;
  streamUrl: string | null;
  enabled: boolean;
};

export type AdminInternetRadioPresetInput = {
  name: string;
  genre?: string;
  description?: string;
  iconUrl?: string;
  programmingUrl?: string;
  streamUrl?: string;
  enabled?: boolean;
};

export async function fetchAdminInternetRadioPresets(): Promise<{
  data: AdminInternetRadioPreset[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: listMockInternetRadioPresets(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ presets: AdminInternetRadioPreset[] }>(
      '/api/admin/internet-radio-presets',
    );
    return { data: data.presets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createAdminInternetRadioPreset(
  input: AdminInternetRadioPresetInput,
): Promise<
  { ok: true; data: AdminInternetRadioPreset } | { ok: false; error: string }
> {
  if (forceMock()) {
    const preset = createMockInternetRadioPreset({
      genre: null,
      description: null,
      iconUrl: null,
      programmingUrl: null,
      streamUrl: null,
      ...input,
    });
    return { ok: true, data: preset };
  }
  try {
    const data = await sendJson<AdminInternetRadioPreset>(
      '/api/admin/internet-radio-presets',
      'POST',
      input,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function patchAdminInternetRadioPreset(
  id: string,
  patch: Partial<AdminInternetRadioPresetInput>,
): Promise<
  { ok: true; data: AdminInternetRadioPreset } | { ok: false; error: string }
> {
  if (forceMock()) {
    const updated = patchMockInternetRadioPreset(id, patch);
    if (!updated) {
      return { ok: false, error: 'Preset not found' };
    }
    return { ok: true, data: updated };
  }
  try {
    const data = await sendJson<AdminInternetRadioPreset>(
      `/api/admin/internet-radio-presets/${encodeURIComponent(id)}`,
      'PATCH',
      patch,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
}

export async function deleteAdminInternetRadioPreset(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    deleteMockInternetRadioPreset(id);
    return { ok: true };
  }
  return mutate(
    `/api/admin/internet-radio-presets/${encodeURIComponent(id)}`,
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
  sound: {
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
      sound: {
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
      sound: {
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
        soundId: string;
      };
    }
  | { ok: false; error: string }
> {
  if (forceMock()) {
    const row = mockRadioSubmissions().find((item) => item.id === id);
    if (!row?.sound.audioUrl) {
      return { ok: false, error: 'No playable audio' };
    }
    return {
      ok: true,
      data: {
        audioUrl: row.sound.audioUrl,
        title: row.sound.title,
        artistName: row.sound.artistName ?? row.submitter?.displayName ?? '',
        soundId: row.sound.id,
      },
    };
  }
  try {
    const data = await getJson<{
      audioUrl: string;
      title: string;
      artistName: string;
      soundId: string;
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

// ── Internet radio station suggestions ──────────────────────────────────────
// Listener-submitted *external* internet radio stations (Store & forward
// widget), not to be confused with AdminRadioSubmission above, which audits
// tracks submitted for Tahti's own co-op radio rotation.

export type AdminRadioStationSuggestionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type AdminRadioStationSuggestion = {
  id: string;
  status: AdminRadioStationSuggestionStatus;
  rejectionNote: string | null;
  createdAt: string;
  submitter: { username: string; displayName: string } | null;
  name: string;
  logoUrl: string | null;
  language: string;
  bitrateKbps: number | null;
  streamUrl: string;
};

function mockRadioStationSuggestions(): AdminRadioStationSuggestion[] {
  return [
    {
      id: 'station-sug-1',
      status: 'PENDING',
      rejectionNote: null,
      createdAt: '2026-08-20T10:00:00.000Z',
      submitter: {
        username: 'kaiku-collective',
        displayName: 'Kaiku Collective',
      },
      name: 'Basso FM',
      logoUrl: null,
      language: 'Finnish',
      bitrateKbps: 128,
      streamUrl: 'https://stream.example.fi/basso-fm.mp3',
    },
    {
      id: 'station-sug-2',
      status: 'PENDING',
      rejectionNote: null,
      createdAt: '2026-08-18T14:30:00.000Z',
      submitter: { username: 'valo-radio', displayName: 'Valo Radio' },
      name: 'Lumo Radio',
      logoUrl: null,
      language: 'Finnish',
      bitrateKbps: 192,
      streamUrl: 'https://stream.example.fi/lumo-radio.aac',
    },
  ];
}

export async function fetchAdminRadioStationSuggestions(): Promise<{
  data: AdminRadioStationSuggestion[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockRadioStationSuggestions(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ items?: AdminRadioStationSuggestion[] }>(
      '/api/admin/radio-station-suggestions?status=PENDING',
    );
    return { data: data.items ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function approveRadioStationSuggestion(id: string) {
  if (forceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio-station-suggestions/${encodeURIComponent(id)}/approve`,
    'POST',
  );
}

export function rejectRadioStationSuggestion(id: string, note?: string) {
  if (forceMock()) {
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/radio-station-suggestions/${encodeURIComponent(id)}/reject`,
    'POST',
    note ? { note } : undefined,
  );
}

export type RadioStationSuggestionInput = {
  name: string;
  logoUrl: string;
  language: string;
  bitrateKbps: string;
  streamUrl: string;
};

export async function submitRadioStationSuggestion(
  input: RadioStationSuggestionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    return { ok: true };
  }
  try {
    await mutate('/api/me/radio-station-suggestions', 'POST', {
      name: input.name,
      logoUrl: input.logoUrl || null,
      language: input.language,
      bitrateKbps: input.bitrateKbps ? Number(input.bitrateKbps) : null,
      streamUrl: input.streamUrl,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not submit suggestion',
    };
  }
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
  soundId: string;
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
        soundId: 'arch-nl-1',
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
        soundId: 'arch-mc-1',
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
      soundId: item.id,
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
    soundId: item.id,
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
  thumbnailUrl?: string | null;
  avatarUrl?: string | null;
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
export type AdminSupportNoteKind = 'MESSAGE' | 'STATUS_CHANGE';

export type AdminSupportTicket = {
  id: string;
  subject: string;
  category: string;
  status: AdminSupportStatus;
  artistUsername: string | null;
  artistDisplayName: string | null;
  contactEmail: string | null;
  createdAt: string;
};

/** One row of a ticket's activity trail — a board reply, or an automatic
 * record of a status transition. Rendered together, oldest first. */
export type AdminSupportNote = {
  id: string;
  body: string;
  kind: AdminSupportNoteKind;
  authorId: string | null;
  authorDisplayName: string | null;
  createdAt: string;
};

export type AdminSupportTicketDetail = AdminSupportTicket & {
  message: string;
  notes: AdminSupportNote[];
};

function mockSupportTickets(): AdminSupportTicketDetail[] {
  return [
    {
      id: 'tkt-1',
      subject: 'Cannot connect OBS to multistream target',
      category: 'broadcast',
      status: 'OPEN',
      artistUsername: 'dj-moonlight',
      artistDisplayName: 'DJ Moonlight',
      contactEmail: null,
      createdAt: '2026-08-16T10:00:00.000Z',
      message:
        'OBS keeps disconnecting from the Twitch multistream target after ~2 minutes. Stream key looks right.',
      notes: [],
    },
    {
      id: 'tkt-2',
      subject: 'Payout never arrived',
      category: 'billing',
      status: 'IN_PROGRESS',
      artistUsername: 'midnight-cartography',
      artistDisplayName: 'Midnight Cartography',
      contactEmail: null,
      createdAt: '2026-08-15T09:00:00.000Z',
      message: "My August fan-sub payout hasn't shown up in Stripe Connect.",
      notes: [
        {
          id: 'note-1',
          body: 'Status changed from OPEN to IN_PROGRESS',
          kind: 'STATUS_CHANGE',
          authorId: 'mock-board',
          authorDisplayName: 'You',
          createdAt: '2026-08-15T12:00:00.000Z',
        },
        {
          id: 'note-2',
          body: 'Checking with Stripe on the transfer — will update within a day.',
          kind: 'MESSAGE',
          authorId: 'mock-board',
          authorDisplayName: 'You',
          createdAt: '2026-08-15T12:05:00.000Z',
        },
      ],
    },
    {
      id: 'tkt-3',
      subject: 'How do I change my channel URL?',
      category: 'general',
      status: 'RESOLVED',
      artistUsername: null,
      artistDisplayName: null,
      contactEmail: 'listener@example.com',
      createdAt: '2026-08-10T09:00:00.000Z',
      message: 'Is there a way to rename my channel slug from settings?',
      notes: [
        {
          id: 'note-3',
          body: 'Settings → Channel & design → Username & domain.',
          kind: 'MESSAGE',
          authorId: 'mock-board',
          authorDisplayName: 'You',
          createdAt: '2026-08-10T10:00:00.000Z',
        },
        {
          id: 'note-4',
          body: 'Status changed from OPEN to RESOLVED',
          kind: 'STATUS_CHANGE',
          authorId: 'mock-board',
          authorDisplayName: 'You',
          createdAt: '2026-08-10T10:01:00.000Z',
        },
      ],
    },
  ];
}

let mockSupportTicketsState: AdminSupportTicketDetail[] | null = null;

function getMockSupportTickets(): AdminSupportTicketDetail[] {
  if (!mockSupportTicketsState) {
    mockSupportTicketsState = mockSupportTickets();
  }
  return mockSupportTicketsState;
}

function toSupportTicketRow(t: AdminSupportTicketDetail): AdminSupportTicket {
  return {
    id: t.id,
    subject: t.subject,
    category: t.category,
    status: t.status,
    artistUsername: t.artistUsername,
    artistDisplayName: t.artistDisplayName,
    contactEmail: t.contactEmail,
    createdAt: t.createdAt,
  };
}

export async function fetchAdminSupportTickets(params?: {
  status?: AdminSupportStatus;
  q?: string;
}): Promise<{ data: AdminSupportTicket[]; meta: FetchMeta }> {
  const status = params?.status;
  const q = params?.q?.trim();
  if (forceMock()) {
    let data = getMockSupportTickets();
    if (status) {
      data = data.filter((t) => t.status === status);
    }
    if (q) {
      const needle = q.toLowerCase();
      data = data.filter(
        (t) =>
          t.subject.toLowerCase().includes(needle) ||
          t.message.toLowerCase().includes(needle) ||
          (t.artistUsername ?? '').toLowerCase().includes(needle) ||
          (t.artistDisplayName ?? '').toLowerCase().includes(needle) ||
          (t.contactEmail ?? '').toLowerCase().includes(needle),
      );
    }
    return {
      data: data.map(toSupportTicketRow),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const qs = new URLSearchParams({ limit: '50' });
    if (status) {
      qs.set('status', status);
    }
    if (q) {
      qs.set('q', q);
    }
    const data = await getJson<{ tickets: AdminSupportTicket[] }>(
      `/api/admin/support/tickets?${qs.toString()}`,
    );
    return { data: data.tickets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchAdminSupportTicketDetail(
  id: string,
): Promise<{ data: AdminSupportTicketDetail | null; meta: FetchMeta }> {
  if (forceMock()) {
    const ticket = getMockSupportTickets().find((t) => t.id === id) ?? null;
    return {
      data: ticket,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminSupportTicketDetail>(
      `/api/admin/support/tickets/${encodeURIComponent(id)}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function updateAdminSupportTicketStatus(
  id: string,
  status: AdminSupportStatus,
): Promise<
  { ok: true; data: AdminSupportTicketDetail } | { ok: false; error: string }
> {
  if (forceMock()) {
    const ticket = getMockSupportTickets().find((t) => t.id === id);
    if (!ticket) {
      return { ok: false, error: 'Ticket not found' };
    }
    if (ticket.status !== status) {
      ticket.notes.push({
        id: `note-${Date.now()}`,
        body: `Status changed from ${ticket.status} to ${status}`,
        kind: 'STATUS_CHANGE',
        authorId: 'mock-board',
        authorDisplayName: 'You',
        createdAt: new Date().toISOString(),
      });
      ticket.status = status;
    }
    return { ok: true, data: ticket };
  }
  try {
    const data = await sendJson<AdminSupportTicketDetail>(
      `/api/admin/support/tickets/${encodeURIComponent(id)}`,
      'PATCH',
      { status },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

export async function postAdminSupportTicketMessage(
  id: string,
  body: string,
): Promise<
  { ok: true; data: AdminSupportTicketDetail } | { ok: false; error: string }
> {
  if (forceMock()) {
    const ticket = getMockSupportTickets().find((t) => t.id === id);
    if (!ticket) {
      return { ok: false, error: 'Ticket not found' };
    }
    ticket.notes.push({
      id: `note-${Date.now()}`,
      body,
      kind: 'MESSAGE',
      authorId: 'mock-board',
      authorDisplayName: 'You',
      createdAt: new Date().toISOString(),
    });
    return { ok: true, data: ticket };
  }
  try {
    const data = await sendJson<AdminSupportTicketDetail>(
      `/api/admin/support/tickets/${encodeURIComponent(id)}/notes`,
      'POST',
      { body },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

// ── Missed live shows ──────────────────────────────────────────────────────

export type AdminMissedShowStatus =
  | 'OPEN'
  | 'REVIEWING'
  | 'ACTIONED'
  | 'DISMISSED';

export type AdminMissedShow = {
  id: string;
  status: AdminMissedShowStatus;
  detectedAt: string;
  scheduledLiveShow: {
    id: string;
    title: string;
    startAt: string;
  };
  channel: {
    slug: string;
    userId: string;
    username: string;
    displayName: string;
  };
};

export async function fetchAdminMissedShows(
  status?: AdminMissedShowStatus,
): Promise<{ data: AdminMissedShow[]; meta: FetchMeta }> {
  try {
    const query = new URLSearchParams({ limit: '100' });
    if (status) {
      query.set('status', status);
    }
    const data = await getJson<{ flags: AdminMissedShow[] }>(
      `/api/admin/missed-live-shows?${query.toString()}`,
    );
    return { data: data.flags, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function updateAdminMissedShow(
  id: string,
  status: AdminMissedShowStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return mutate(
    `/api/admin/missed-live-shows/${encodeURIComponent(id)}`,
    'PATCH',
    { status },
  );
}

// ── Top lists ───────────────────────────────────────────────────────────────

export type AdminTopListPeriod = 'month' | 'half_year' | 'all_time';
export type AdminTopListDimension = 'type' | 'genre';
export type AdminTopListSort = 'desc' | 'asc';

export type AdminTopListEntry = {
  soundId: string;
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
      soundId: `${b.bucket}-${i}`,
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
  /** Paying/association-member accounts report unlimited storage — resolved
   * server-side (see AdminStorageUsageRowSchema in tahti-org); render as-is,
   * never re-derive from tier client-side. */
  unlimited: boolean;
};

/** Free/used/total for a physical or billed storage backend. `totalBytes`/
 * `freeBytes` are `null` when the backend has no fixed capacity to report
 * (a usage-billed object store) or the reading failed (host statfs error);
 * `note` carries the human-readable reason in that case. */
export type AdminStorageDiskSpace = {
  totalBytes: number | null;
  freeBytes: number | null;
  usedBytes: number | null;
  note: string | null;
};

export type AdminStorageOverview = {
  totalQuotaBytes: number;
  totalUsedBytes: number;
  userCount: number;
  users: AdminStorageUserRow[];
  /** The API host's local disk — also what the object-storage hot/streaming
   * cache lives on. */
  localDisk: AdminStorageDiskSpace;
  /** The object-storage backend (MinIO/S3-compatible). Billed by usage on
   * some providers, so totalBytes/freeBytes can be null even when usedBytes
   * is a real, tracked figure. */
  objectStorage: AdminStorageDiskSpace;
};

function mockStorageOverview(): AdminStorageOverview {
  const users: AdminStorageUserRow[] = [
    {
      userId: 'u-1',
      username: 'dj-moonlight',
      displayName: 'DJ Moonlight',
      quotaBytes: 500 * 1024 * 1024,
      usedBytes: 412 * 1024 * 1024,
      unlimited: false,
    },
    {
      userId: 'u-2',
      username: 'midnight-cartography',
      displayName: 'Midnight Cartography',
      quotaBytes: 500 * 1024 * 1024,
      usedBytes: 538 * 1024 * 1024,
      unlimited: false,
    },
    {
      userId: 'u-3',
      username: 'kaiku-collective',
      displayName: 'Kaiku Collective',
      quotaBytes: 1024 * 1024 * 1024,
      usedBytes: 201 * 1024 * 1024,
      // ARTIST-tier/association-member account — the backend resolves this
      // to unlimited storage regardless of the numeric quotaBytes above.
      unlimited: true,
    },
    {
      userId: 'u-4',
      username: 'northern-lights',
      displayName: 'Northern Lights',
      quotaBytes: 500 * 1024 * 1024,
      usedBytes: 89 * 1024 * 1024,
      unlimited: false,
    },
  ];
  const totalUsedBytes = users.reduce((s, u) => s + u.usedBytes, 0);
  return {
    totalQuotaBytes: users.reduce((s, u) => s + u.quotaBytes, 0),
    totalUsedBytes,
    userCount: users.length,
    users,
    localDisk: {
      totalBytes: 500 * 1024 ** 3,
      freeBytes: 120 * 1024 ** 3,
      usedBytes: 380 * 1024 ** 3,
      note: null,
    },
    objectStorage: {
      totalBytes: null,
      freeBytes: null,
      usedBytes: totalUsedBytes,
      note: 'Object storage is billed by usage, not a fixed volume — there is no total/free to report.',
    },
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

// ── Storage: per-user file drill-down ───────────────────────────────────────

export type AdminStorageUserFile = {
  id: string;
  kind: 'archive' | 'stash';
  title: string;
  sizeBytes: number | null;
  createdAt: string;
  contentType: string | null;
  isPublic: boolean | null;
  /** Gates the play button — never inferred client-side, the backend already
   * knows which content types/formats are audio. */
  isAudio: boolean;
  previewUrl: string | null;
  /** Cumulative sizeBytes total up to and including this row (oldest-first). */
  runningTotalBytes: number;
};

export type AdminStorageUserDetail = {
  userId: string;
  username: string;
  displayName: string;
  tier: 'FREE' | 'ARTIST' | 'STUDIO';
  quotaBytes: number | null;
  usedBytes: number;
  unlimited: boolean;
  files: AdminStorageUserFile[];
};

function mockStorageUserDetail(userId: string): AdminStorageUserDetail | null {
  const row = (mockStorageState ?? mockStorageOverview()).users.find(
    (u) => u.userId === userId,
  );
  if (!row) {
    return null;
  }
  const files = (mockAdminFilesState ?? mockAdminFiles())
    .filter((f) => f.username === row.username)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  let running = 0;
  return {
    userId: row.userId,
    username: row.username,
    displayName: row.displayName,
    tier: row.unlimited ? 'ARTIST' : 'FREE',
    quotaBytes: row.unlimited ? null : row.quotaBytes,
    usedBytes: row.usedBytes,
    unlimited: row.unlimited,
    files: files.map((f) => {
      running += f.sizeBytes ?? 0;
      return {
        id: f.id,
        kind: f.contentType === 'STASH' ? 'stash' : 'archive',
        title: f.title,
        sizeBytes: f.sizeBytes,
        createdAt: f.createdAt,
        contentType: f.contentType,
        isPublic: f.isPublic,
        isAudio: f.audioUrl != null,
        previewUrl: f.audioUrl,
        runningTotalBytes: running,
      };
    }),
  };
}

export async function fetchAdminStorageUserFiles(userId: string): Promise<{
  data: AdminStorageUserDetail | null;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: mockStorageUserDetail(userId),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminStorageUserDetail>(
      `/api/admin/storage/users/${encodeURIComponent(userId)}/files`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
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
  sizeBytes: number | null;
  format: string | null;
  createdAt: string;
  channelSlug: string;
  userId: string;
  username: string;
  displayName: string;
  audioUrl: string | null;
  /** Count of ArchiveItemVersion rows — real, always populated by
   * /api/admin/files (../tahti/apps/api/src/routes/admin/files.ts). */
  revisionCount: number;
  /** ArchiveItem has no per-item R2-mirror field in the schema yet (unlike
   * ReleaseTrack/ReleaseTrackVersion, which do) — genuinely not tracked, not
   * just unwired here. Stays optional/undefined against the real API until
   * that schema + worker support exists; mock data fills it in for the UI. */
  storageLocation?: 'local' | 'r2' | null;
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
      sizeBytes: 8_400_000,
      format: 'MP3',
      createdAt: '2026-08-10T12:00:00.000Z',
      channelSlug: 'dj-moonlight',
      userId: 'u-1',
      username: 'dj-moonlight',
      displayName: 'DJ Moonlight',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      revisionCount: 3,
      storageLocation: 'r2',
    },
    {
      id: 'file-2',
      title: 'Route 550 (live set)',
      artistName: 'Midnight Cartography',
      genre: 'Electronic',
      contentType: 'LIVE_SET',
      isPublic: true,
      durationSec: 3480,
      sizeBytes: 92_000_000,
      format: 'FLAC',
      createdAt: '2026-08-09T18:00:00.000Z',
      channelSlug: 'midnight-cartography',
      userId: 'u-2',
      username: 'midnight-cartography',
      displayName: 'Midnight Cartography',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      revisionCount: 1,
      storageLocation: 'r2',
    },
    {
      id: 'file-3',
      title: 'Echo Chamber Cypher',
      artistName: 'Kaiku Collective',
      genre: 'Hip-hop',
      contentType: 'TRACK',
      isPublic: false,
      durationSec: 201,
      sizeBytes: 5_100_000,
      format: 'MP3',
      createdAt: '2026-08-05T09:00:00.000Z',
      channelSlug: 'kaiku-collective',
      userId: 'u-3',
      username: 'kaiku-collective',
      displayName: 'Kaiku Collective',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      revisionCount: 5,
      storageLocation: 'local',
    },
    {
      id: 'file-4',
      title: 'Aurora Drift (unmastered)',
      artistName: 'Northern Lights',
      genre: null,
      contentType: 'STASH',
      isPublic: false,
      durationSec: 279,
      sizeBytes: 41_000_000,
      format: 'WAV',
      createdAt: '2026-08-01T09:00:00.000Z',
      channelSlug: 'northern-lights',
      userId: 'u-4',
      username: 'northern-lights',
      displayName: 'Northern Lights',
      audioUrl: null,
      revisionCount: 1,
      storageLocation: 'local',
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
    const qs = new URLSearchParams({ limit: '100' });
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

export type AdminFileAudio = {
  audioUrl: string | null;
  title: string;
  artistName: string;
  channelSlug: string;
  bannerUrl: string | null;
  durationSec: number | null;
};

/** Presigned playback URL for one file — fetched lazily on play-button click
 * rather than eagerly for every row in the list (the list can be up to 100
 * rows; the per-user drill-down already returns previewUrl inline instead,
 * since that list is small). */
export async function fetchAdminFileAudio(id: string): Promise<{
  data: AdminFileAudio | null;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const file = (mockAdminFilesState ?? mockAdminFiles()).find(
      (f) => f.id === id,
    );
    return {
      data: file
        ? {
            audioUrl: file.audioUrl,
            title: file.title,
            artistName: file.artistName,
            channelSlug: file.channelSlug,
            bannerUrl: null,
            durationSec: file.durationSec,
          }
        : null,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminFileAudio>(
      `/api/admin/files/${encodeURIComponent(id)}/audio`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
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
    if (allowMockFallback()) {
      return { data: mockGovernanceOverview(), meta: failMeta(err) };
    }
    return {
      data: {
        openMotions: 0,
        pendingVenueVerifications: 0,
        lastAnnualReportYear: null,
        boardResolutionsThisYear: 0,
      },
      meta: apiErrorMeta(err),
    };
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

export type AdminGrantPreviewArtist = {
  userId: string;
  username: string;
  displayName: string;
  units: number;
  amountCents: number;
  freeDownloads: number;
  paidDownloads: number;
  fanSubEuros: number;
};

export type AdminGrantPreview = {
  forYear: number;
  alreadyRun: boolean;
  poolCents: number;
  totalUnits: number;
  unallocatedCents: number;
  artists: AdminGrantPreviewArtist[];
};

export type AdminGrantHistoryDetail = AdminGrantYearSummary & {
  disbursedAt: string | null;
  grants: Array<{
    publishedAs: string | null;
    units: number;
    amountCents: string;
    state: string;
  }>;
};

function mockGrantPreview(year: number): AdminGrantPreview {
  const artists = [
    {
      userId: 'artist-1',
      username: 'northern-lights',
      displayName: 'Northern Lights',
      units: 128,
      amountCents: 64000,
      freeDownloads: 48,
      paidDownloads: 12,
      fanSubEuros: 20,
    },
    {
      userId: 'artist-2',
      username: 'kaiku-collective',
      displayName: 'Kaiku Collective',
      units: 74,
      amountCents: 37000,
      freeDownloads: 32,
      paidDownloads: 5,
      fanSubEuros: 17,
    },
  ];
  return {
    forYear: year,
    alreadyRun: false,
    poolCents: 101000,
    totalUnits: 202,
    unallocatedCents: 0,
    artists,
  };
}

export async function fetchAdminGrantPreview(
  year: number,
): Promise<{ data: AdminGrantPreview | null; meta: FetchMeta }> {
  if (forceMock()) {
    return {
      data: mockGrantPreview(year),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminGrantPreview>(
      `/api/admin/grants/preview/${year}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function fetchAdminGrantHistory(
  year: number,
): Promise<{ data: AdminGrantHistoryDetail | null; meta: FetchMeta }> {
  try {
    const data = await getJson<AdminGrantHistoryDetail>(
      `/api/v1/transparency/grants/${year}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function runAdminGrantCycle(
  year: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return mutate(`/api/admin/grants/run/${year}`, 'POST');
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
      state: 'CLOSED',
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

export async function fetchAdminGovernanceMeetings(): Promise<{
  data: GovernanceMeeting[];
  meta: FetchMeta;
}> {
  try {
    const data = await getJson<GovernanceMeeting[]>(
      '/api/admin/governance/meetings',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createAdminGovernanceMeeting(input: {
  title: string;
  type: GovernanceMeeting['type'];
  scheduledAt?: string;
  location?: string;
  remoteUrl?: string;
  noticeAt?: string;
  eligibleMemberCount?: number;
  quorumRequired?: number;
  agenda?: Array<{ title: string; description?: string }>;
}): Promise<{ data: GovernanceMeeting | null; meta: FetchMeta }> {
  try {
    const data = await sendJson<GovernanceMeeting>(
      '/api/admin/governance/meetings',
      'POST',
      input,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function patchAdminGovernanceMeeting(
  id: string,
  input: Partial<
    Pick<
      GovernanceMeeting,
      | 'state'
      | 'scheduledAt'
      | 'location'
      | 'remoteUrl'
      | 'noticeAt'
      | 'eligibleMemberCount'
      | 'quorumRequired'
      | 'minutesKey'
      | 'minutesApprovedAt'
    >
  > & { agenda?: unknown },
): Promise<{ data: GovernanceMeeting | null; meta: FetchMeta }> {
  try {
    const data = await sendJson<GovernanceMeeting>(
      `/api/admin/governance/meetings/${encodeURIComponent(id)}`,
      'PATCH',
      input,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function fetchAdminGovernanceDocuments(): Promise<{
  data: GovernanceDocument[];
  meta: FetchMeta;
}> {
  try {
    const data = await getJson<GovernanceDocument[]>(
      '/api/admin/governance/documents',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createAdminGovernanceDocument(input: {
  title: string;
  type: GovernanceDocument['type'];
  description?: string;
  storageKey?: string;
  externalUrl?: string;
  version?: number;
  effectiveAt?: string;
  publishedAt?: string | null;
  meetingId?: string | null;
}): Promise<{ data: GovernanceDocument | null; meta: FetchMeta }> {
  try {
    const data = await sendJson<GovernanceDocument>(
      '/api/admin/governance/documents',
      'POST',
      input,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function fetchAdminResolutions(publishedOnly = false): Promise<{
  data: BoardResolution[];
  meta: FetchMeta;
}> {
  try {
    const suffix = publishedOnly ? '?publishedOnly=true' : '';
    const data = await getJson<BoardResolution[]>(
      `/api/admin/resolutions${suffix}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createAdminResolution(input: {
  title: string;
  body: string;
  votedAt: string;
  outcome: 'PASSED' | 'FAILED' | 'DEFERRED';
  voteFor: number;
  voteAgainst: number;
  voteAbstain: number;
}): Promise<{ data: BoardResolution | null; meta: FetchMeta }> {
  try {
    const data = await sendJson<BoardResolution>(
      '/api/admin/resolutions',
      'POST',
      input,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function patchAdminResolution(
  id: string,
  input: Partial<
    Pick<BoardResolution, 'title' | 'body' | 'outcome' | 'publishedAt'>
  >,
): Promise<{ data: BoardResolution | null; meta: FetchMeta }> {
  try {
    const data = await sendJson<BoardResolution>(
      `/api/admin/resolutions/${encodeURIComponent(id)}`,
      'PATCH',
      input,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export type AdminAnnualReport = {
  id: string;
  year: number;
  storageKey: string;
  generatedAt: string;
  generatedByDisplayName: string | null;
  downloadUrl: string | null;
};

export async function fetchAdminAnnualReports(): Promise<{
  data: AdminAnnualReport[];
  meta: FetchMeta;
}> {
  try {
    const data = await getJson<AdminAnnualReport[]>('/api/admin/reports');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function generateAdminAnnualReport(year: number): Promise<{
  data: AdminAnnualReport | null;
  meta: FetchMeta;
}> {
  try {
    const data = await sendJson<AdminAnnualReport>(
      `/api/admin/reports/annual/${year}`,
      'POST',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
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
    { name: 'Mixcloud', live: true, detail: 'Sound uploads connected' },
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
    if (allowMockFallback()) {
      return { data: mockIntegrationStatus(), meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

// ── Disco-widgets ──────────────────────────────────────────────────────────

export type AdminDiscoWidgetScope = 'LISTENER' | 'ARTIST' | 'ADMIN';
export type AdminDiscoWidgetStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISABLED';

export type AdminDiscoWidget = {
  id: string;
  slug: string;
  scope: AdminDiscoWidgetScope;
  status: AdminDiscoWidgetStatus;
  name: string;
  description: string;
  authorName: string;
  categories: string[];
  iconUrl: string | null;
  currentVersion: string;
  bundleSizeBytes: number;
  moderationNote: string | null;
  createdAt: string;
  updatedAt: string;
};

const MOCK_DISCO_WIDGETS: AdminDiscoWidget[] = [
  {
    id: 'widget-random-artist',
    slug: 'random-artist-week',
    scope: 'LISTENER',
    status: 'APPROVED',
    name: 'Random artist of the week',
    description: 'Highlights one artist from the community each week.',
    authorName: 'Tahti',
    categories: ['social', 'new-releases'],
    iconUrl: null,
    currentVersion: '1.0.0',
    bundleSizeBytes: 18400,
    moderationNote: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'widget-channel-stats',
    slug: 'channel-stats',
    scope: 'ARTIST',
    status: 'APPROVED',
    name: 'Channel stats',
    description: 'Shows the artist channel’s current listener statistics.',
    authorName: 'Tahti',
    categories: ['stats'],
    iconUrl: null,
    currentVersion: '1.2.0',
    bundleSizeBytes: 22100,
    moderationNote: null,
    createdAt: '2026-07-15T00:00:00.000Z',
    updatedAt: '2026-07-15T00:00:00.000Z',
  },
];

let mockDiscoWidgets = [...MOCK_DISCO_WIDGETS];

export async function fetchAdminDiscoWidgets(
  scope?: AdminDiscoWidgetScope,
  status?: AdminDiscoWidgetStatus,
): Promise<{ data: AdminDiscoWidget[]; meta: FetchMeta }> {
  if (forceMock()) {
    return {
      data: mockDiscoWidgets.filter(
        (widget) =>
          (!scope || widget.scope === scope) &&
          (!status || widget.status === status),
      ),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const query = new URLSearchParams();
    if (scope) {
      query.set('scope', scope);
    }
    if (status) {
      query.set('status', status);
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    const data = await getJson<{ widgets: AdminDiscoWidget[] }>(
      `/api/admin/disco-widgets${suffix}`,
    );
    return { data: data.widgets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export type AdminDiscoWidgetPatch = {
  name: string;
  description: string;
  authorName: string;
  categories: string[];
  iconUrl?: string;
};

export async function registerAdminDiscoWidget(
  input: AdminDiscoWidgetPatch & {
    slug: string;
    scope: AdminDiscoWidgetScope;
  },
): Promise<
  { ok: true; data: AdminDiscoWidget } | { ok: false; error: string }
> {
  if (forceMock()) {
    const widget: AdminDiscoWidget = {
      id: `widget-${Date.now()}`,
      ...input,
      iconUrl: input.iconUrl || null,
      status: 'DRAFT',
      currentVersion: '0.0.0',
      bundleSizeBytes: 0,
      moderationNote: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDiscoWidgets = [widget, ...mockDiscoWidgets];
    return { ok: true, data: widget };
  }
  try {
    const data = await sendJson<AdminDiscoWidget>(
      '/api/admin/disco-widgets',
      'POST',
      input,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Registration failed',
    };
  }
}

export async function patchAdminDiscoWidget(
  id: string,
  patch: AdminDiscoWidgetPatch,
): Promise<
  { ok: true; data: AdminDiscoWidget } | { ok: false; error: string }
> {
  if (forceMock()) {
    const existing = mockDiscoWidgets.find((widget) => widget.id === id);
    if (!existing) {
      return { ok: false, error: 'Widget not found' };
    }
    const updated = { ...existing, ...patch, iconUrl: patch.iconUrl || null };
    mockDiscoWidgets = mockDiscoWidgets.map((widget) =>
      widget.id === id ? updated : widget,
    );
    return { ok: true, data: updated };
  }
  try {
    const data = await sendJson<AdminDiscoWidget>(
      `/api/admin/disco-widgets/${encodeURIComponent(id)}`,
      'PATCH',
      patch,
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
}

export async function deleteAdminDiscoWidget(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    mockDiscoWidgets = mockDiscoWidgets.filter((widget) => widget.id !== id);
    return { ok: true };
  }
  return mutate(`/api/admin/disco-widgets/${encodeURIComponent(id)}`, 'DELETE');
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
    if (allowMockFallback()) {
      return { data: mockLanguages(), meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
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

// ── Admin activity feed ──────────────────────────────────────────────────
// Thin client over the real GET /api/admin/audit endpoint (board-gated,
// already paginated/filterable/CSV-exportable server-side — see
// tahti/apps/api/src/routes/admin/audit.ts). Renders through the same
// LogViewer UI as the Nuclear desktop player's Logs page; see
// AdminActivityView.tsx for the mapping into LogEntryData.
//
// "Listened track" is deliberately absent here: ListenEvent rows are
// anonymous/deduped by design (no userId column — see ListenEvent in
// schema.prisma) for listener privacy, so there is no real per-user "X
// listened to Y" event to show. AdminActivityView shows an aggregate plays
// count instead of fabricating attribution the data doesn't have.
export type AdminActivityEntry = {
  id: string;
  action: string;
  actorId: string;
  actorDisplayName: string | null;
  actorUsername: string | null;
  targetId: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
};

export type AdminActivityFilters = {
  page?: number;
  limit?: number;
  action?: string;
  actorId?: string;
  since?: string;
  until?: string;
};

function mockActivityEntries(): AdminActivityEntry[] {
  const now = Date.now();
  const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();
  return [
    {
      id: 'mock-act-1',
      action: 'USER_LOGIN',
      actorId: 'u-1',
      actorDisplayName: 'Nova Drift',
      actorUsername: 'nova-drift',
      targetId: null,
      meta: {},
      createdAt: minutesAgo(2),
    },
    {
      id: 'mock-act-2',
      action: 'ARCHIVE_ITEM_LIKE',
      actorId: 'u-2',
      actorDisplayName: 'Echo Harbor',
      actorUsername: 'echo-harbor',
      targetId: 'item-1',
      meta: { title: 'Midnight Static', channelSlug: 'nova-drift' },
      createdAt: minutesAgo(6),
    },
    {
      id: 'mock-act-3',
      action: 'FAN_SUBSCRIPTION_CREATE',
      actorId: 'u-3',
      actorDisplayName: 'DJ Kaski',
      actorUsername: 'dj-kaski',
      targetId: 'u-1',
      meta: { tierName: 'Supporter', amountCents: 500 },
      createdAt: minutesAgo(14),
    },
    {
      id: 'mock-act-4',
      action: 'RELEASE_PUBLISH',
      actorId: 'u-1',
      actorDisplayName: 'Nova Drift',
      actorUsername: 'nova-drift',
      targetId: 'rel-1',
      meta: { title: 'Static & Silence EP' },
      createdAt: minutesAgo(40),
    },
    {
      id: 'mock-act-5',
      action: 'ARTIST_FOLLOW',
      actorId: 'u-2',
      actorDisplayName: 'Echo Harbor',
      actorUsername: 'echo-harbor',
      targetId: 'u-3',
      meta: { artistDisplayName: 'DJ Kaski', artistUsername: 'dj-kaski' },
      createdAt: minutesAgo(55),
    },
    {
      id: 'mock-act-6',
      action: 'USER_REGISTER',
      actorId: 'u-4',
      actorDisplayName: 'Rautatie',
      actorUsername: 'rautatie',
      targetId: null,
      meta: {},
      createdAt: minutesAgo(80),
    },
    {
      id: 'mock-act-7',
      action: 'VOTE_CAST',
      actorId: 'u-4',
      actorDisplayName: 'Rautatie',
      actorUsername: 'rautatie',
      targetId: 'motion-1',
      meta: { choice: 'YES', subjectTitle: 'Approve 2026 grant formula' },
      createdAt: minutesAgo(95),
    },
    {
      id: 'mock-act-8',
      action: 'MOTION_COMMENT_CREATE',
      actorId: 'u-1',
      actorDisplayName: 'Nova Drift',
      actorUsername: 'nova-drift',
      targetId: 'motion-1',
      meta: { subjectTitle: 'Approve 2026 grant formula' },
      createdAt: minutesAgo(110),
    },
    {
      id: 'mock-act-9',
      action: 'FEATURE_REQUEST_COMMENT_CREATE',
      actorId: 'u-2',
      actorDisplayName: 'Echo Harbor',
      actorUsername: 'echo-harbor',
      targetId: 'fr-1',
      meta: { subjectTitle: 'Crossfade between archive tracks' },
      createdAt: minutesAgo(125),
    },
  ];
}

export async function fetchAdminActivity(
  filters: AdminActivityFilters = {},
): Promise<{
  data: AdminActivityEntry[];
  total: number;
  page: number;
  limit: number;
  meta: FetchMeta;
}> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;

  if (forceMock()) {
    const ledger = listMockCommerceAudit().map((row) => ({
      id: row.id,
      action: row.action,
      actorId: `e2e-${row.actorUsername}`,
      actorDisplayName: row.actorDisplayName,
      actorUsername: row.actorUsername,
      targetId: null,
      meta: row.meta,
      createdAt: row.createdAt,
    }));
    const rows = [...ledger, ...mockActivityEntries()];
    return {
      data: rows,
      total: rows.length,
      page: 1,
      limit: rows.length,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters.action) {
      qs.set('action', filters.action);
    }
    if (filters.actorId) {
      qs.set('actorId', filters.actorId);
    }
    if (filters.since) {
      qs.set('since', filters.since);
    }
    if (filters.until) {
      qs.set('until', filters.until);
    }
    const data = await getJson<{
      page: number;
      limit: number;
      total: number;
      items: AdminActivityEntry[];
    }>(`/api/admin/audit?${qs.toString()}`);
    return {
      data: data.items,
      total: data.total,
      page: data.page,
      limit: data.limit,
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], total: 0, page, limit, meta: failMeta(err) };
  }
}

const GOVERNANCE_ACTIVITY_ACTIONS = [
  'VOTE_CAST',
  'FEATURE_REQUEST_VOTE',
  'FEATURE_REQUEST_UNVOTE',
  'MOTION_COMMENT_CREATE',
  'FEATURE_REQUEST_COMMENT_CREATE',
] as const;

export async function fetchAdminGovernanceActivity(): Promise<{
  data: AdminActivityEntry[];
  totalVotes: number;
  totalComments: number;
  meta: FetchMeta;
}> {
  const results = await Promise.all(
    GOVERNANCE_ACTIVITY_ACTIONS.map((action) =>
      fetchAdminActivity({ action, limit: 100 }),
    ),
  );
  const data = results
    .flatMap((result) => result.data)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );
  return {
    data,
    totalVotes: results
      .slice(0, 3)
      .reduce((total, result) => total + result.total, 0),
    totalComments: results
      .slice(3)
      .reduce((total, result) => total + result.total, 0),
    meta: results[0]?.meta ?? { source: 'api' },
  };
}

export function adminActivityExportCsvUrl(): string {
  return `${apiBase()}/api/admin/audit/export.csv`;
}

// ── Admin container logs ─────────────────────────────────────────────────
// Thin client over GET /api/admin/logs (board-gated), which queries the
// Loki already running on vimage6 server-to-server — see
// tahti/apps/api/src/routes/admin/logs.ts. `service` here is whatever the
// Loki stream's own label resolved to (raw container name, e.g.
// "tahti-stack-api-1"), not a curated list — real container names, not
// mocked.
export type AdminLogEntry = {
  timestampMs: number;
  service: string;
  line: string;
};

export type AdminLogsFilters = {
  service?: string;
  search?: string;
  since?: string;
  until?: string;
  limit?: number;
};

function mockLogEntries(): AdminLogEntry[] {
  const now = Date.now();
  const minutesAgo = (m: number) => now - m * 60_000;
  return [
    {
      timestampMs: minutesAgo(1),
      service: 'tahti-stack-api-1',
      line: 'GET /api/v1/channels/nova-drift 200 12ms',
    },
    {
      timestampMs: minutesAgo(3),
      service: 'tahti-stack-worker-1',
      line: '[transcode] archive item 8f2c… done in 4.2s',
    },
    {
      timestampMs: minutesAgo(5),
      service: 'tahti-stack-chat-1',
      line: 'client subscribed to channel:nova-drift',
    },
    {
      timestampMs: minutesAgo(9),
      service: 'tahti-stack-icecast-1',
      line: 'source connected: /live/nova-drift',
    },
  ];
}

export async function fetchAdminContainerLogs(
  filters: AdminLogsFilters = {},
): Promise<{
  entries: AdminLogEntry[];
  lokiReachable: boolean;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      entries: mockLogEntries(),
      lokiReachable: true,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const qs = new URLSearchParams();
    if (filters.service) {
      qs.set('service', filters.service);
    }
    if (filters.search) {
      qs.set('search', filters.search);
    }
    if (filters.since) {
      qs.set('since', filters.since);
    }
    if (filters.until) {
      qs.set('until', filters.until);
    }
    qs.set('limit', String(filters.limit ?? 500));
    const data = await getJson<{
      entries: AdminLogEntry[];
      lokiReachable: boolean;
    }>(`/api/admin/logs?${qs.toString()}`);
    return { ...data, meta: { source: 'api' } };
  } catch (err) {
    return { entries: [], lokiReachable: false, meta: failMeta(err) };
  }
}
