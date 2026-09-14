import type { FetchMeta } from '../client';
import { getJson, mutate } from '../http';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '../mode';

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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
