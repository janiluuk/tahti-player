import { useCallback, useEffect, useState } from 'react';

import {
  FilterChips,
  LogViewer,
  Pagination,
  ViewShell,
  type LogEntryData,
  type LogLevel,
} from '@tahti-player/ui';

import {
  ADMIN_AUDIT_TOPICS,
  adminActivityExportCsvUrl,
  fetchAdminActivity,
  type AdminActivityEntry,
  type AdminAuditTopicId,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';

const REFRESH_INTERVAL_MS = 15_000;
const PAGE_LIMIT = 50;

// Groups the ~40 AuditAction values into a handful of scopes so the
// ScopeFilter is actually useful — one entry per action would just mirror
// the search box.
const ACTION_SCOPE: Record<string, string> = {
  USER_LOGIN: 'auth',
  USER_REGISTER: 'auth',
  API_TOKEN_CREATE: 'auth',
  API_TOKEN_REVOKE: 'auth',
  CONTENT_UPLOAD: 'content',
  RELEASE_PUBLISH: 'content',
  ARCHIVE_EDIT_RENDER: 'content',
  ARCHIVE_EDIT_BOUNCE: 'content',
  ARCHIVE_EDIT_PUBLISH: 'content',
  ARCHIVE_METADATA_ADMIN_EDIT: 'content',
  SOUND_ITEM_LIKE: 'engagement',
  ARTIST_FOLLOW: 'engagement',
  FAN_SUBSCRIPTION_CREATE: 'money',
  LEDGER_ENTRY_CREATE: 'money',
  GRANT_RUN: 'money',
  STRIPE_WEBHOOK_ERROR: 'money',
  DOWNLOAD_FRAUD_ALERT: 'money',
  MEMBERSHIP_RENEWAL_REMINDER: 'money',
  MEMBERSHIP_LAPSED: 'money',
  ENGAGEMENT_ADJUSTMENT: 'money',
  CHAT_BAN: 'moderation',
  CHAT_UNBAN: 'moderation',
  CHAT_MESSAGE_DELETE: 'moderation',
  MEMBER_SUSPEND: 'moderation',
  MEMBER_REINSTATE: 'moderation',
  USER_SUSPEND: 'moderation',
  USER_UNSUSPEND: 'moderation',
  BOARD_ROLE_CHANGE: 'moderation',
  USER_TIER_CHANGE: 'moderation',
  ACCOUNT_DELETE: 'moderation',
  STREAM_KEY_ROTATE: 'broadcast',
  RTMP_TARGET_ADD: 'broadcast',
  RTMP_TARGET_DELETE: 'broadcast',
  STREAM_FORCE_OFFLINE: 'broadcast',
  STREAM_RESTART: 'broadcast',
  MOTION_CREATE: 'governance',
  MOTION_OPEN: 'governance',
  MOTION_CLOSE: 'governance',
  MOTION_COMMENT_CREATE: 'governance',
  VOTE_CAST: 'governance',
  FEATURE_REQUEST_CREATE: 'governance',
  FEATURE_REQUEST_VOTE: 'governance',
  FEATURE_REQUEST_UNVOTE: 'governance',
  FEATURE_REQUEST_COMMENT_CREATE: 'governance',
  FEATURE_REQUEST_STATUS_UPDATE: 'governance',
  FEATURE_REQUEST_QUARTERLY_REPORT: 'governance',
};

const ACTION_LEVEL: Record<string, LogLevel> = {
  STRIPE_WEBHOOK_ERROR: 'error',
  DOWNLOAD_FRAUD_ALERT: 'error',
  MEMBER_SUSPEND: 'warn',
  USER_SUSPEND: 'warn',
  CHAT_BAN: 'warn',
  ACCOUNT_DELETE: 'warn',
  MEMBERSHIP_LAPSED: 'warn',
  USER_TIER_CHANGE: 'warn',
  STREAM_FORCE_OFFLINE: 'warn',
};

function actorLabel(entry: AdminActivityEntry): string {
  return entry.actorDisplayName ?? entry.actorUsername ?? entry.actorId;
}

function messageFor(entry: AdminActivityEntry): string {
  const actor = actorLabel(entry);
  const meta = entry.meta;
  const str = (key: string) =>
    typeof meta[key] === 'string' ? (meta[key] as string) : null;
  const subject =
    str('subjectTitle') ??
    str('title') ??
    entry.targetId ??
    'a governance item';

  switch (entry.action) {
    case 'USER_LOGIN':
      return `${actor} logged in`;
    case 'USER_REGISTER':
      return `${actor} created an account`;
    case 'CONTENT_UPLOAD':
      return `${actor} uploaded ${str('title') ?? 'a track'}`;
    case 'RELEASE_PUBLISH':
      return `${actor} published ${str('title') ?? 'a release'}`;
    case 'SOUND_ITEM_LIKE':
      return `${actor} liked ${str('title') ?? 'a track'}`;
    case 'ARTIST_FOLLOW':
      return `${actor} followed ${str('artistDisplayName') ?? str('artistUsername') ?? 'an artist'}`;
    case 'VOTE_CAST':
      return `${actor} voted ${str('choice') ?? 'on'} on ${subject}`;
    case 'FEATURE_REQUEST_VOTE':
      return `${actor} voted for ${subject}`;
    case 'FEATURE_REQUEST_UNVOTE':
      return `${actor} removed their vote from ${subject}`;
    case 'MOTION_COMMENT_CREATE':
      return `${actor} commented on ${subject}`;
    case 'FEATURE_REQUEST_COMMENT_CREATE':
      return `${actor} commented on ${subject}`;
    case 'FAN_SUBSCRIPTION_CREATE': {
      const cents =
        typeof meta.amountCents === 'number' ? meta.amountCents : null;
      const amount = cents !== null ? ` (€${(cents / 100).toFixed(2)}/mo)` : '';
      return `${actor} subscribed — ${str('tierName') ?? 'a tier'}${amount}`;
    }
    case 'LEDGER_ENTRY_CREATE': {
      const title = str('title');
      return title
        ? `${actor} logged a ledger entry — ${title}`
        : `${actor} logged a ledger entry`;
    }
    case 'USER_TIER_CHANGE': {
      const from = str('from') ?? 'unknown';
      const to = str('to') ?? 'unknown';
      return `${actor} changed account tier from ${from} to ${to}`;
    }
    default:
      return `${actor} — ${entry.action.toLowerCase().replaceAll('_', ' ')}`;
  }
}

function toLogEntry(entry: AdminActivityEntry): LogEntryData {
  return {
    id: entry.id,
    timestamp: new Date(entry.createdAt),
    level: ACTION_LEVEL[entry.action] ?? 'info',
    target: entry.action,
    source: { type: 'core', scope: ACTION_SCOPE[entry.action] ?? 'other' },
    message: messageFor(entry),
  };
}

export function AdminActivityView({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [entries, setEntries] = useState<AdminActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [topic, setTopic] = useState<AdminAuditTopicId | 'ALL'>('ALL');

  const load = useCallback(async () => {
    const res = await fetchAdminActivity({
      page,
      limit: PAGE_LIMIT,
      topic: topic === 'ALL' ? undefined : topic,
    });
    setEntries(res.data);
    setTotal(res.total);
    setLoading(false);
  }, [page, topic]);

  useEffect(() => {
    setLoading(true);
    void load();
    const interval = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const logs = entries.map(toLogEntry);
  const scopes = [...new Set(logs.map((l) => l.source.scope))].sort();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const exportTopic = topic === 'ALL' ? undefined : topic;

  const content = (
    <StudioPanel>
      <p className="text-foreground-secondary mb-3 text-xs">
        {total} event{total === 1 ? '' : 's'}
        {topic !== 'ALL'
          ? ` in ${ADMIN_AUDIT_TOPICS.find((t) => t.id === topic)?.label ?? topic}`
          : ''}
        . Listen counts are anonymous by design (no per-user attribution exists
        for plays) so individual listens aren&apos;t shown here — see Stats for
        aggregate play counts.{' '}
        <a
          href={adminActivityExportCsvUrl({ topic: exportTopic })}
          className="text-primary underline-offset-2 hover:underline"
        >
          Export{topic !== 'ALL' ? ' this topic' : ' full audit log'} as CSV
        </a>
      </p>

      <FilterChips
        aria-label="Audit topics"
        className="border-border mb-3 border-b pb-3"
        items={[
          { id: 'ALL', label: 'All activity' },
          ...ADMIN_AUDIT_TOPICS.map((item) => ({
            id: item.id,
            label: item.label,
          })),
        ]}
        selected={topic}
        onChange={(id) => {
          setTopic(id as AdminAuditTopicId | 'ALL');
          setPage(1);
        }}
      />

      {loading ? (
        <PageLoading label="Loading activity…" />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="h-[60vh]">
            <LogViewer.Root
              logs={logs}
              scopes={scopes}
              onClear={() => {}}
              onExport={() => {}}
              onOpenLogFolder={() => {}}
            >
              <div className="flex flex-wrap items-center gap-4">
                <LogViewer.SearchInput />
                <LogViewer.DateRangeFilter />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <LogViewer.LevelFilter />
                <LogViewer.ScopeFilter />
                <LogViewer.EntryCount />
              </div>
              <LogViewer.VirtualizedList />
              <LogViewer.EntryDetailDialog />
            </LogViewer.Root>
          </div>
          {totalPages > 1 ? (
            <div className="flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                labels={{
                  navigation: 'Activity pages',
                  previous: 'Previous page',
                  next: 'Next page',
                  page: (n) => `Page ${n}`,
                }}
              />
            </div>
          ) : null}
        </div>
      )}
    </StudioPanel>
  );

  if (embedded) {
    return content;
  }

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/logs">
          <div className="flex max-w-6xl flex-col gap-6">
            <ViewShell title="Activity" classes={{ root: 'px-0 pt-0' }}>
              {content}
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
