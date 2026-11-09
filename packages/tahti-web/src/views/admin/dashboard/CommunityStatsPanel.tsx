import { LifeBuoyIcon, MailIcon, MessagesSquareIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
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
    ? `${formatCount(box.total)} in the inbox`
    : 'Mail stats unavailable';
}

export function CommunityStatsPanel() {
  const { t } = useTranslation('web');
  const [stats, setStats] = useState<AdminCommunityStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminCommunityStats(DAYS).then((result) => {
      if (!cancelled) {
        setStats(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
              ? `Busiest ${numericDate(new Date(`${busiest.date}T00:00:00`))}: ${formatCount(busiest.count)}`
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
