import type { FetchMeta } from './client';
import { apiBase, getJson, mutate, sendJson } from './http';
import { listMockCommerceAudit } from './mock-commerce-ledger';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';

export * from './admin/admin-financial';
export * from './admin/admin-news';
export * from './admin/admin-radio';

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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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

export * from './admin/admin-users';
export * from './admin/admin-selects';
export * from './admin/admin-streams';

export * from './admin/admin-support';

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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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

export * from './admin/admin-storage';

// ── Content reports ─────────────────────────────────────────────────────────

export type AdminContentReportStatus =
  | 'OPEN'
  | 'REVIEWING'
  | 'ACTIONED'
  | 'DISMISSED';

export type AdminContentReportRow = {
  id: string;
  targetType:
    | 'SOUND_ITEM'
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
      targetType: 'SOUND_ITEM',
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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

export * from './admin/admin-governance';

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
  if (isForceMock()) {
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

export * from './admin/admin-addons';

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
  if (isForceMock()) {
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
  if (isForceMock()) {
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
  if (isForceMock()) {
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

  if (isForceMock()) {
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

/** Board-facing governance audit topic ids — mirrors
 * `GOVERNANCE_AUDIT_TOPIC_IDS` in `../tahti-org` `@tahti/shared`. Kept local
 * so this package does not import the sibling. */
export const ADMIN_AUDIT_TOPICS = [
  { id: 'finance', label: 'Finance & grants' },
  { id: 'subscriptions', label: 'Fan subscriptions' },
  { id: 'membership', label: 'Membership & register' },
  { id: 'decisions', label: 'Motions, votes & resolutions' },
  { id: 'officers', label: 'Board & roles' },
  { id: 'meetings', label: 'Meetings & documents' },
  { id: 'radio', label: 'Radio bookings' },
] as const;

export type AdminAuditTopicId = (typeof ADMIN_AUDIT_TOPICS)[number]['id'];

/** Mirror of sibling `GOVERNANCE_AUDIT_TOPICS` action sets — mock filter only. */
const ADMIN_AUDIT_TOPIC_ACTIONS: Record<AdminAuditTopicId, readonly string[]> =
  {
    finance: [
      'LEDGER_ENTRY_CREATE',
      'GRANT_RUN',
      'ENGAGEMENT_ADJUSTMENT',
      'STRIPE_WEBHOOK_ERROR',
      'DOWNLOAD_FRAUD_ALERT',
    ],
    subscriptions: ['FAN_SUBSCRIPTION_CREATE'],
    membership: [
      'MEMBER_SUSPEND',
      'MEMBER_REINSTATE',
      'MEMBERSHIP_RENEWAL_REMINDER',
      'MEMBERSHIP_LAPSED',
      'ACCOUNT_DELETE',
      'USER_TIER_CHANGE',
    ],
    decisions: [
      'MOTION_CREATE',
      'MOTION_OPEN',
      'MOTION_CLOSE',
      'MOTION_COMMENT_CREATE',
      'VOTE_CAST',
      'RESOLUTION_CREATE',
      'RESOLUTION_UPDATE',
      'FEATURE_REQUEST_QUARTERLY_REPORT',
    ],
    officers: ['BOARD_ROLE_CHANGE', 'USER_SUSPEND', 'USER_UNSUSPEND'],
    meetings: [
      'MEETING_CREATE',
      'MEETING_UPDATE',
      'MEETING_ATTENDANCE_UPSERT',
      'DOCUMENT_CREATE',
      'ANNUAL_REPORT_GENERATE',
    ],
    radio: [
      'RADIO_SLOT_BOOKING_CREATE',
      'RADIO_SLOT_BOOKING_UPDATE',
      'RADIO_SLOT_BOOKING_CANCEL',
    ],
  };

export type AdminActivityFilters = {
  page?: number;
  limit?: number;
  action?: string;
  actorId?: string;
  since?: string;
  until?: string;
  /** Board governance topic (finance, decisions, …). When set, the backend
   * restricts to that topic's AuditAction set even with scope=all. */
  topic?: AdminAuditTopicId;
  /** Backend defaults to 'governance' (deliberately excludes login/like/chat
   * "ops noise" for the board-facing governance audit view) — this admin
   * activity feed wants everything, so it defaults to 'all' here instead. */
  scope?: 'governance' | 'all';
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
      action: 'SOUND_ITEM_LIKE',
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

  if (isForceMock()) {
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
    let rows = [...ledger, ...mockActivityEntries()];
    if (filters.topic) {
      const topicActions = new Set(ADMIN_AUDIT_TOPIC_ACTIONS[filters.topic]);
      rows = rows.filter((row) => topicActions.has(row.action));
    }
    const total = rows.length;
    const start = (page - 1) * limit;
    return {
      data: rows.slice(start, start + limit),
      total,
      page,
      limit,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      scope: filters.scope ?? 'all',
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
    if (filters.topic) {
      qs.set('topic', filters.topic);
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

export function adminActivityExportCsvUrl(
  filters: Pick<AdminActivityFilters, 'topic' | 'scope'> = {},
): string {
  const qs = new URLSearchParams({
    scope: filters.scope ?? 'all',
  });
  if (filters.topic) {
    qs.set('topic', filters.topic);
  }
  return `${apiBase()}/api/admin/audit/export.csv?${qs.toString()}`;
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
  if (isForceMock()) {
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
