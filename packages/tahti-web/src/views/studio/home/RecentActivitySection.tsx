import { Link } from '@tanstack/react-router';
import { HeartHandshakeIcon, MusicIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';

import {
  fetchFanPayoutSummary,
  fetchRecentSounds,
  type RecentSound,
} from '../../../api/studio/studio-recent';
import { PageError, PageErrorBanner } from '../../../components/PageStates';
import { dateLocaleTag } from '../../../lib/locale';
import { formatDuration } from '../../../lib/playableToTrack';
import { Group } from './HomeTiles';

const money = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'EUR',
});

function formatActivityDate(value: string): string {
  return new Intl.DateTimeFormat(dateLocaleTag(), {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

const cardClass =
  'border-border bg-background-secondary/35 flex min-w-0 flex-col gap-2 rounded-xl border p-4 shadow-sm';
const labelClass =
  'text-foreground-secondary flex items-center gap-2 text-xs font-semibold tracking-wide uppercase';

/** Studio home: the newest uploads and this month's fan-subscription
 * income, as on the legacy dashboard. */
export function RecentActivitySection() {
  const { t } = useTranslation('web');
  const [sounds, setSounds] = useState<RecentSound[]>([]);
  const [incomeCents, setIncomeCents] = useState<number | null>(null);
  const [soundsError, setSoundsError] = useState<string | null>(null);
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchRecentSounds().then(({ data, meta }) => {
      if (!cancelled) {
        setSounds(data);
        setSoundsError(meta.source === 'api' ? (meta.reason ?? null) : null);
      }
    });
    void fetchFanPayoutSummary().then(({ data, meta }) => {
      if (!cancelled) {
        setIncomeCents(data?.thisMonthNetCents ?? null);
        setIncomeError(meta.source === 'api' ? (meta.reason ?? null) : null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const error = soundsError ?? incomeError;
  const retry = () => setReloadKey((key) => key + 1);

  if (sounds.length === 0 && incomeCents == null) {
    return error ? (
      <Group title={t('studioHub.recentActivity')}>
        <PageError
          title={t('studioHub.recentActivityLoadError')}
          description={error}
          onRetry={retry}
        />
      </Group>
    ) : null;
  }

  return (
    <Group title={t('studioHub.recentActivity')}>
      {error ? (
        <PageErrorBanner
          title={t('studioHub.recentActivityRefreshError')}
          description={error}
          onRetry={retry}
        />
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sounds.length > 0 ? (
          <section
            aria-label={t('recentActivitySection.recentUploads')}
            className={cardClass}
          >
            <span className={labelClass}>
              <MusicIcon
                size={15}
                aria-hidden
                className="text-primary-strong"
              />
              {t('recentActivitySection.recentUploads')}
            </span>
            <ul className="flex flex-col gap-1.5 text-sm">
              {sounds.map((sound) => (
                <li
                  key={sound.id}
                  className="flex min-w-0 items-baseline gap-2"
                >
                  <Link
                    to="/studio/sounds/$id"
                    params={{ id: sound.id }}
                    className="min-w-0 truncate font-medium hover:underline"
                  >
                    {sound.title}
                  </Link>
                  <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
                    {[
                      formatDuration(sound.durationSec),
                      formatActivityDate(sound.createdAt),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {incomeCents != null ? (
          <Link
            to="/studio/revenue"
            className={`${cardClass} hover:bg-background-secondary transition-colors`}
          >
            <span className={labelClass}>
              <HeartHandshakeIcon
                size={15}
                aria-hidden
                className="text-primary-strong"
              />
              {t('recentActivitySection.fanSubscriptions')}
            </span>
            <span className="font-display text-2xl font-extrabold tabular-nums">
              {money.format(incomeCents / 100)}
            </span>
            <span className="text-foreground-secondary text-xs">
              Paid out to you this month · Fans &amp; revenue
            </span>
          </Link>
        ) : null}
      </div>
    </Group>
  );
}
