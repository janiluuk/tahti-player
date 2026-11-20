import { useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
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
import {
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { usePolling } from '../../hooks/usePolling';
import { webT } from '../../lib/webT';

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
  PATTERN_FRAUD_ALERT: 'money',
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
  DISCUSSION_POST_REMOVE: 'governance',
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
  PATTERN_FRAUD_ALERT: 'error',
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
  const t = webT();
  const actor = actorLabel(entry);
  const meta = entry.meta;
  const str = (key: string) =>
    typeof meta[key] === 'string' ? (meta[key] as string) : null;
  const subject =
    str('subjectTitle') ??
    str('title') ??
    entry.targetId ??
    t('adminActivityViewBatch33.aGovernanceItem');
  const channel =
    str('channelSlug') ??
    entry.targetId ??
    t('adminActivityViewBatch33.aChannel');

  switch (entry.action) {
    case 'USER_LOGIN':
      return t('adminActivityViewBatch33.loggedIn', { actor });
    case 'USER_REGISTER':
      return t('adminActivityViewBatch33.registered', { actor });
    case 'CONTENT_UPLOAD':
      return t('adminActivityViewBatch33.uploaded', {
        actor,
        title: str('title') ?? t('adminActivityViewBatch33.aTrack'),
      });
    case 'RELEASE_PUBLISH':
      return t('adminActivityViewBatch33.published', {
        actor,
        title: str('title') ?? t('adminActivityViewBatch33.aRelease'),
      });
    case 'SOUND_ITEM_LIKE':
      return t('adminActivityViewBatch33.liked', {
        actor,
        title: str('title') ?? t('adminActivityViewBatch33.aTrack'),
      });
    case 'ARTIST_FOLLOW':
      return t('adminActivityViewBatch33.followed', {
        actor,
        artist:
          str('artistDisplayName') ??
          str('artistUsername') ??
          t('adminActivityViewBatch33.anArtist'),
      });
    case 'VOTE_CAST': {
      const choice = str('choice');
      return choice
        ? t('adminActivityViewBatch33.votedChoice', { actor, choice, subject })
        : t('adminActivityViewBatch33.votedOn', { actor, subject });
    }
    case 'FEATURE_REQUEST_VOTE':
      return t('adminActivityViewBatch33.votedFor', { actor, subject });
    case 'FEATURE_REQUEST_UNVOTE':
      return t('adminActivityViewBatch33.unvoted', { actor, subject });
    case 'MOTION_COMMENT_CREATE':
    case 'FEATURE_REQUEST_COMMENT_CREATE':
      return t('adminActivityViewBatch33.commented', { actor, subject });
    case 'DISCUSSION_POST_REMOVE':
      return meta.byAuthor === true
        ? t('adminActivityViewBatch33.removedOwnReply', { actor })
        : t('adminActivityViewBatch33.removedReply', { actor });
    case 'FAN_SUBSCRIPTION_CREATE': {
      const tier = str('tierName') ?? t('adminActivityViewBatch33.aTier');
      return typeof meta.amountCents === 'number'
        ? t('adminActivityViewBatch33.subscribedAmount', {
            actor,
            tier,
            amount: (meta.amountCents / 100).toFixed(2),
          })
        : t('adminActivityViewBatch33.subscribed', { actor, tier });
    }
    case 'LEDGER_ENTRY_CREATE': {
      const title = str('title');
      return title
        ? t('adminActivityViewBatch33.ledgerEntryTitled', { actor, title })
        : t('adminActivityViewBatch33.ledgerEntry', { actor });
    }
    case 'DOWNLOAD_FRAUD_ALERT':
      return t('adminActivityViewBatch33.downloadAlert', { channel });
    case 'PATTERN_FRAUD_ALERT': {
      const code = str('code') ?? 'pattern';
      return t('adminActivityViewBatch33.patternAlert', {
        code: code.replaceAll('_', ' ').toLowerCase(),
        channel,
      });
    }
    case 'USER_TIER_CHANGE': {
      const unknown = t('adminActivityViewBatch33.unknown');
      return t('adminActivityViewBatch33.tierChange', {
        actor,
        from: str('from') ?? unknown,
        to: str('to') ?? unknown,
      });
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
  const { t } = useTranslation('web');
  const [entries, setEntries] = useState<AdminActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [topic, setTopic] = useState<AdminAuditTopicId | 'ALL'>('ALL');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetchAdminActivity({
      page,
      limit: PAGE_LIMIT,
      topic: topic === 'ALL' ? undefined : topic,
    });
    const reason = res.meta.source === 'api' ? res.meta.reason : undefined;
    if (reason) {
      // A failed poll keeps what is already on screen.
      setError(reason);
    } else {
      setEntries(res.data);
      setTotal(res.total);
      setLoaded(true);
      setError(null);
    }
    setLoading(false);
  }, [page, topic]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);
  usePolling(() => {
    void load();
  }, REFRESH_INTERVAL_MS);

  const logs = entries.map(toLogEntry);
  const scopes = [...new Set(logs.map((l) => l.source.scope))].sort();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const exportTopic = topic === 'ALL' ? undefined : topic;
  const topicLabelKey = ADMIN_AUDIT_TOPICS.find(
    (item) => item.id === topic,
  )?.labelKey;

  const content = (
    <StudioPanel>
      <p className="text-foreground-secondary mb-3 text-xs">
        {topic !== 'ALL'
          ? t('adminActivityViewBatch33.eventCountInTopic', {
              count: total,
              topic: topicLabelKey ? t(topicLabelKey) : topic,
            })
          : t('adminActivityViewBatch33.eventCount', { count: total })}{' '}
        {t('adminActivityViewBatch33.listensNote')}{' '}
        <a
          href={adminActivityExportCsvUrl({ topic: exportTopic })}
          className="text-primary-strong underline underline-offset-2"
        >
          {topic !== 'ALL'
            ? t('adminActivityViewBatch33.exportTopicCsv')
            : t('adminActivityViewBatch33.exportAllCsv')}
        </a>
      </p>

      <FilterChips
        aria-label={t('adminActivityView.auditTopics')}
        className="border-border mb-3 border-b pb-3"
        items={[
          { id: 'ALL', label: t('adminActivityViewFields.allActivity') },
          ...ADMIN_AUDIT_TOPICS.map((item) => ({
            id: item.id,
            label: t(item.labelKey),
          })),
        ]}
        selected={topic}
        onChange={(id) => {
          setTopic(id as AdminAuditTopicId | 'ALL');
          setPage(1);
        }}
      />

      {loading ? (
        <PageLoading label={t('loading.loadingActivity')} />
      ) : error && !loaded ? (
        <PageError
          title={t('loadErrors.couldnTLoadActivity')}
          description={error}
          onRetry={() => {
            setLoading(true);
            void load();
          }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {error ? (
            <PageErrorBanner
              title={t('loadErrors.couldnTRefreshActivity')}
              description={t('loadErrors.showingTheLastLoadedEntries')}
              onRetry={() => void load()}
            />
          ) : null}
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
                  navigation: t('adminActivityViewBatch33.activityPages'),
                  previous: t('library.history.previousPage'),
                  next: t('library.history.nextPage'),
                  page: (n) => t('library.history.page', { n }),
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
            <ViewShell
              title={t('adminActivityView.activity')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              {content}
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
