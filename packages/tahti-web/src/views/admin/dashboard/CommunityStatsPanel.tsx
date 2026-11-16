import { LifeBuoyIcon, MailIcon, MessagesSquareIcon } from 'lucide-react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { StatTile, type StatTone } from '@tahti-player/ui';

import {
  fetchAdminCommunityStats,
  summarizeChatSeries,
  type AdminCommunityStats,
  type AdminMailbox,
} from '../../../api/admin';
import { PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { numericDate } from '../../../lib/relativeDate';
import { useSnapshotFetch } from '../../../lib/useSnapshotFetch';

const DAYS = 30;

const COMMUNITY_TONES = {
  chat: 'blue',
  hello: 'purple',
  support: 'orange',
} as const satisfies Record<string, StatTone>;

function formatCount(value: number | null | undefined): string {
  return value == null ? '—' : value.toLocaleString('fi-FI');
}

function mailboxSublabel(box: AdminMailbox | undefined): string {
  return box
    ? i18n.t('web:batch51.inTheInbox', { count: formatCount(box.total) })
    : i18n.t('web:batch51.mailStatsUnavailable');
}

const NO_STATS: AdminCommunityStats = {
  chatLast24h: null,
  chatSeries: [],
  mail: null,
};

export function CommunityStatsPanel() {
  const { t } = useTranslation('web');
  const { data, error } = useSnapshotFetch<AdminCommunityStats>(
    'admin-community-stats',
    async () => {
      const result = await fetchAdminCommunityStats(DAYS);
      if (
        result.chatLast24h === null &&
        result.mail === null &&
        result.chatSeries.length === 0
      ) {
        throw new Error('Community stats unavailable');
      }
      return result;
    },
  );
  const stats = data ?? (error ? NO_STATS : null);

  if (!stats) {
    return (
      <StudioPanel title={t('communityStatsPanel.chatAndMail')}>
        <PageLoading label={t('loading.loadingChatAndMailStats')} />
      </StudioPanel>
    );
  }

  const { total, busiest } = summarizeChatSeries(stats.chatSeries);

  return (
    <StudioPanel title={t('communityStatsPanel.chatAndMail')}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t('communityStatsPanel.chatMessages24H')}
          tone={COMMUNITY_TONES.chat}
          icon={<MessagesSquareIcon size={16} />}
          value={formatCount(stats.chatLast24h)}
        />
        <StatTile
          label={t('communityStatsPanelLabels.chatMessagesDaysDays', { DAYS })}
          tone={COMMUNITY_TONES.chat}
          icon={<MessagesSquareIcon size={16} />}
          value={stats.chatSeries.length > 0 ? formatCount(total) : '—'}
          sublabel={
            busiest
              ? i18n.t('web:batch51.busiest', {
                  date: numericDate(new Date(`${busiest.date}T00:00:00`)),
                  count: formatCount(busiest.count),
                })
              : undefined
          }
        />
        <StatTile
          label="hello@ unread"
          tone={COMMUNITY_TONES.hello}
          icon={<MailIcon size={16} />}
          value={formatCount(stats.mail?.hello.unseen)}
          sublabel={mailboxSublabel(stats.mail?.hello)}
        />
        <StatTile
          label="support@ unread"
          tone={COMMUNITY_TONES.support}
          icon={<LifeBuoyIcon size={16} />}
          value={formatCount(stats.mail?.support.unseen)}
          sublabel={mailboxSublabel(stats.mail?.support)}
        />
      </div>
    </StudioPanel>
  );
}
