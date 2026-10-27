import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { FilterChips, ShareList } from '@tahti-player/ui';

import {
  fetchAdminListening,
  LISTEN_SURFACE_LABELS,
  type AdminListening,
  type AdminListeningRange,
} from '../../api/admin/admin-listening';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { StatNumber } from '../../components/tahti/StatNumber';

const RANGES = [
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: 'all', label: 'All time' },
] as const;

/** Platform listening for the board, from listen sessions (Admin → Content). */
export function AdminListeningPanel() {
  const [range, setRange] = useState<AdminListeningRange>('30');
  const [data, setData] = useState<AdminListening | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    void fetchAdminListening(range).then((result) => {
      if (cancelled) {
        return;
      }
      setError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setData(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [range, attempt]);

  return (
    <StudioPanel
      title="Listening"
      description="How much people listen on Tahti, where, and which channels they spend the time with. Bots are left out."
    >
      <div className="flex flex-col gap-4">
        <FilterChips
          items={RANGES}
          selected={range}
          onChange={(id) => setRange(id as AdminListeningRange)}
          aria-label="Listening period"
        />
        {!data ? (
          <PageLoading label="Loading listening…" />
        ) : error ? (
          <PageError
            title="Could not load listening"
            description={error}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : data.listens === 0 ? (
          <PageEmpty title="No listening in this period." />
        ) : (
          <>
            <dl className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ['Listens', data.listens],
                  ['Minutes listened', data.minutes],
                  ['Signed-in listeners', data.signedInListeners],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-foreground-secondary text-xs tracking-wide uppercase">
                    {label}
                  </dt>
                  <dd>
                    <StatNumber className="mt-1 block text-2xl">
                      {value.toLocaleString()}
                    </StatNumber>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-6 lg:grid-cols-2">
              <ShareList
                title="Listened on"
                headingLevel={3}
                items={data.surfaces.map((item) => ({
                  id: item.name,
                  label: LISTEN_SURFACE_LABELS[item.name] ?? item.name,
                  share: item.share,
                }))}
              />
              <div>
                <h3 className="mb-2 text-sm font-semibold">Top channels</h3>
                <ol className="divide-border divide-y text-sm">
                  {data.topChannels.map((channel) => (
                    <li
                      key={channel.slug}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <Link
                        to="/channel/$slug"
                        params={{ slug: channel.slug }}
                        className="min-w-0 truncate hover:underline"
                      >
                        {channel.name}
                      </Link>
                      <span className="text-foreground-secondary shrink-0 text-xs">
                        {channel.minutes.toLocaleString()} min ·{' '}
                        {channel.listens.toLocaleString()} listens
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        )}
      </div>
    </StudioPanel>
  );
}
