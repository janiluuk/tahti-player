import { useEffect, useState } from 'react';

import { StatTile } from '@tahti-player/ui';

import {
  fetchAdminCommunityStats,
  summarizeChatSeries,
  type AdminCommunityStats,
  type AdminMailbox,
} from '../../../api/admin';
import { PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';

const DAYS = 30;

function formatCount(value: number | null | undefined): string {
  return value == null ? '—' : value.toLocaleString('fi-FI');
}

function mailboxSublabel(box: AdminMailbox | undefined): string {
  return box
    ? `${formatCount(box.total)} in the inbox`
    : 'Mail stats unavailable';
}

export function CommunityStatsPanel() {
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
      <StudioPanel title="Chat and mail">
        <PageLoading label="Loading chat and mail stats…" />
      </StudioPanel>
    );
  }

  const { total, busiest } = summarizeChatSeries(stats.chatSeries);

  return (
    <StudioPanel title="Chat and mail">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Chat messages, 24 h"
          value={formatCount(stats.chatLast24h)}
        />
        <StatTile
          label={`Chat messages, ${DAYS} days`}
          value={stats.chatSeries.length > 0 ? formatCount(total) : '—'}
          sublabel={
            busiest
              ? `Busiest ${new Date(`${busiest.date}T00:00:00Z`).toLocaleDateString()}: ${formatCount(busiest.count)}`
              : undefined
          }
        />
        <StatTile
          label="hello@ unread"
          value={formatCount(stats.mail?.hello.unseen)}
          sublabel={mailboxSublabel(stats.mail?.hello)}
        />
        <StatTile
          label="support@ unread"
          value={formatCount(stats.mail?.support.unseen)}
          sublabel={mailboxSublabel(stats.mail?.support)}
        />
      </div>
    </StudioPanel>
  );
}
