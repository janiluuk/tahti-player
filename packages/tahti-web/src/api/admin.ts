import type { FetchMeta } from './client';
import { apiBase, getJson } from './http';
import { listMockCommerceAudit } from './mock-commerce-ledger';
import { failMeta, isForceMock } from './mode';

export * from './admin/admin-announcements';
export * from './admin/admin-beta';
export * from './admin/admin-content-reports';
export * from './admin/admin-dashboard';
export * from './admin/admin-financial';
export * from './admin/admin-i18n';
export * from './admin/admin-news';
export * from './admin/admin-radio';
export * from './admin/admin-status';
export * from './admin/admin-top-lists';
export * from './admin/admin-vendors';
export * from './admin/admin-users';
export * from './admin/admin-selects';
export * from './admin/admin-streams';

export * from './admin/admin-support';

export * from './admin/admin-storage';

export * from './admin/admin-governance';

export * from './admin/admin-addons';

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
