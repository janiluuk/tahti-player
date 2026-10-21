import { Link } from '@tanstack/react-router';
import { HeartHandshakeIcon, MusicIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  fetchFanPayoutSummary,
  fetchRecentSounds,
  type RecentSound,
} from '../../../api/studio/studio-recent';
import { PageError, PageErrorBanner } from '../../../components/PageStates';
import { Group } from './HomeTiles';

const money = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'EUR',
});

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
});

function duration(sec: number | null): string | null {
  if (sec == null) {
    return null;
  }
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const cardClass =
  'border-border bg-background-secondary/35 flex min-w-0 flex-col gap-2 rounded-xl border p-4 shadow-sm';
const labelClass =
  'text-foreground-secondary flex items-center gap-2 text-xs font-semibold tracking-wide uppercase';

/** Studio home: the newest uploads and this month's fan-subscription
 * income, as on the legacy dashboard. */
export function RecentActivitySection() {
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
      <Group title="Recent activity">
        <PageError
          title="Could not load recent activity"
          description={error}
          onRetry={retry}
        />
      </Group>
    ) : null;
  }

  return (
    <Group title="Recent activity">
      {error ? (
        <PageErrorBanner
          title="Could not refresh recent activity"
          description={error}
          onRetry={retry}
        />
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sounds.length > 0 ? (
          <section aria-label="Recent uploads" className={cardClass}>
            <span className={labelClass}>
              <MusicIcon
                size={15}
                aria-hidden
                className="text-primary-strong"
              />
              Recent uploads
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
                      duration(sound.durationSec),
                      dateFormat.format(new Date(sound.createdAt)),
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
              Fan subscriptions
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
