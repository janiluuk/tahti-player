import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import {
  fetchStatsPlays,
  type StatsPlays,
  type StatsPlaysRange,
} from '../../api/studio-extras';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';

const RANGES: StatsPlaysRange[] = ['7', '30', 'all'];

function formatAxisDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function StudioStatsDetailView() {
  const [range, setRange] = useState<StatsPlaysRange>('30');
  const [data, setData] = useState<StatsPlays | null>(null);
  const [source, setSource] = useState('…');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchStatsPlays(range).then((r) => {
      if (cancelled) return;
      setData(r.data);
      setSource(r.meta.source);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const maxPlays = useMemo(
    () => Math.max(1, ...(data?.daily.map((d) => d.plays) ?? [1])),
    [data],
  );

  const label =
    range === '7' ? '7 days' : range === '30' ? '30 days' : 'all time';

  return (
    <StudioGate>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <StudioNav current="/studio/stats" />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-foreground-secondary mb-1 text-xs">
              <Link
                to="/studio/stats"
                className="underline-offset-2 hover:underline"
              >
                ← Stats
              </Link>
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              Plays & listeners
            </h1>
            <p className="text-foreground-secondary mt-1 text-sm">
              Daily series from <code>/api/me/stats/plays</code>. Source:{' '}
              {source}.
            </p>
          </div>
          <div
            className="border-border flex gap-1 rounded-lg border p-1"
            role="group"
            aria-label="Plays time range"
          >
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide uppercase ${
                  range === r
                    ? 'bg-primary text-foreground'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                {r === 'all' ? 'All' : `${r}d`}
              </button>
            ))}
          </div>
        </div>

        {loading || !data ? (
          <p className="text-foreground-secondary text-sm">Loading plays…</p>
        ) : (
          <>
            <section className="border-border rounded-xl border p-4">
              <div className="text-foreground-secondary text-xs tracking-wide uppercase">
                Plays — last {label}
              </div>
              <p className="font-display mt-1 text-3xl font-bold">
                {data.totalPlays.toLocaleString()}
              </p>
              <p className="text-foreground-secondary mt-1 text-xs">
                {data.totalDownloads.toLocaleString()} downloads
                {data.totalSmartLinkClicks != null
                  ? ` · ${data.totalSmartLinkClicks.toLocaleString()} smart-link clicks`
                  : ''}
              </p>

              <div
                role="img"
                aria-label="Plays chart"
                className="mt-4 flex h-40 items-end gap-0.5"
              >
                {data.daily.length === 0 ? (
                  <p className="text-foreground-secondary text-sm">
                    No daily points in this range.
                  </p>
                ) : (
                  data.daily.map((d) => {
                    const pct = Math.round((d.plays / maxPlays) * 100);
                    const h = Math.max(d.plays > 0 ? 8 : 2, pct);
                    return (
                      <div
                        key={d.date}
                        title={`${d.date}: ${d.plays} plays`}
                        className="bg-primary/80 hover:bg-primary min-w-0 flex-1 rounded-t-sm"
                        style={{ height: `${h}%` }}
                      />
                    );
                  })
                )}
              </div>
              {data.daily.length > 0 && (
                <div
                  className="text-foreground-secondary mt-2 flex justify-between text-[10px]"
                  aria-hidden
                >
                  <span>{formatAxisDate(data.daily[0]!.date)}</span>
                  {data.daily.length > 2 && (
                    <span>
                      {formatAxisDate(
                        data.daily[Math.floor(data.daily.length / 2)]!.date,
                      )}
                    </span>
                  )}
                  <span>
                    {formatAxisDate(data.daily[data.daily.length - 1]!.date)}
                  </span>
                </div>
              )}
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-display text-lg font-bold">
                Download countries
              </h2>
              {(data.downloadCountries ?? []).length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  No geo breakdown in this response.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {(data.downloadCountries ?? []).map((c) => (
                    <li
                      key={c.countryCode}
                      className="border-border flex justify-between gap-2 rounded border px-3 py-2 text-sm"
                    >
                      <span>
                        {c.displayName}{' '}
                        <span className="text-foreground-secondary">
                          ({c.countryCode})
                        </span>
                      </span>
                      <span className="text-foreground-secondary">
                        {c.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </StudioGate>
  );
}
