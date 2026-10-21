import { useEffect, useState } from 'react';

import { StatTile } from '@tahti-player/ui';

import {
  fetchNewsletterSubscriberStats,
  type NewsletterSubscriberStats as Stats,
} from '../../../api/studio-extras';
import { PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';

export function NewsletterSubscriberStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchNewsletterSubscriberStats().then((result) => {
      if (!cancelled) {
        setStats(result.data);
        setError(
          result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <StudioPanel title="Subscribers">
        <PageError
          title="Couldn't load subscriber stats"
          description={error}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </StudioPanel>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <StudioPanel title="Subscribers">
      <div
        className="grid gap-3 sm:grid-cols-3"
        data-testid="newsletter-subscriber-stats"
      >
        <StatTile
          value={stats.confirmed}
          label="Confirmed"
          sublabel={
            stats.total > stats.confirmed
              ? `${stats.total - stats.confirmed} unconfirmed or unsubscribed`
              : undefined
          }
        />
        <StatTile value={stats.newLast30Days} label="New in 30 days" />
        <StatTile
          value={stats.fanSubscriberCount}
          label="Fans only"
          sublabel="Get fan-only sends"
        />
      </div>
    </StudioPanel>
  );
}
