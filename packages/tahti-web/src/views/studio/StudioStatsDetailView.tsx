import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { FilterChips } from '@tahti-player/ui';

import {
  fetchStatsPlays,
  type StatsPlays,
  type StatsPlaysRange,
} from '../../api/studio-extras';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPageHeader, StudioPanel } from '../../components/StudioPanel';
import { Eyebrow } from '../../components/tahti/Eyebrow';
import { StatNumber } from '../../components/tahti/StatNumber';
import { flagEmoji } from '../../lib/countries';

const RANGES: Array<{ id: StatsPlaysRange; label: string }> = [
  { id: '7', label: '7d' },
  { id: '30', label: '30d' },
  { id: 'all', label: 'All' },
];

function formatAxisDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function StudioStatsDetailView() {
  const [range, setRange] = useState<StatsPlaysRange>('30');
  const [data, setData] = useState<StatsPlays | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchStatsPlays(range).then((r) => {
      if (cancelled) {
        return;
      }
      setData(r.data);
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
    range === '7'
      ? '7 days'
      : range === '30'
        ? '30 days'
        : 'all time';

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/stats" />
        <p className="text-foreground-secondary -mb-2 text-xs">
          <Link
            to="/studio/insights"
            className="underline-offset-2 hover:underline"
          >
            ← Insights
          </Link>
        </p>
        <StudioPageHeader
          title="Insights"
          subtitle="Daily plays, downloads, and listener activity."
          action={
            <FilterChips
              items={RANGES}
              selected={range}
              onChange={(id) => setRange(id as StatsPlaysRange)}
              aria-label="Plays time range"
            />
          }
        />

        {loading || !data ? (
          <StudioPanel>
            <PageLoading label="Loading plays…" />
          </StudioPanel>
        ) : (
          <>
            <StudioPanel>
              <Eyebrow>Plays — last {label}</Eyebrow>
              <StatNumber className="mt-1 block text-3xl">
                {data.totalPlays.toLocaleString()}
              </StatNumber>
              <p className="text-foreground-secondary mt-1 text-xs">
                {data.totalDownloads.toLocaleString()} downloads
                {data.totalSmartLinkClicks != null
                  ? `, ${data.totalSmartLinkClicks.toLocaleString()} smart-link clicks`
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
            </StudioPanel>

            <StudioPanel title="Download countries">
              {(data.downloadCountries ?? []).length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  No geo breakdown in this response.
                </p>
              ) : (
                <ul className="divide-border divide-y">
                  {(data.downloadCountries ?? []).map((c) => (
                    <li
                      key={c.countryCode}
                      className="flex justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                    >
                      <span className="font-medium">
                        {flagEmoji(c.countryCode)} {c.displayName}
                      </span>
                      <span className="text-foreground-secondary tabular-nums">
                        {c.count.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </StudioPanel>
          </>
        )}
      </div>
    </StudioGate>
  );
}
