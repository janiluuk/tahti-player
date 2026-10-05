import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import {
  CalendarHeatmap,
  DayOfWeekChart,
  FilterChips,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchStatsPlays,
  type StatsPlays,
  type StatsPlaysRange,
} from '../../api/studio-extras';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { Eyebrow } from '../../components/tahti/Eyebrow';
import { StatNumber } from '../../components/tahti/StatNumber';
import { flagEmoji } from '../../lib/countries';
import { monthLabelsShort, weekdayLabelsShort } from '../../lib/historyStats';
import { useThemeStore } from '../../plugins/themes';

const RANGES: Array<{ id: StatsPlaysRange; label: string }> = [
  { id: '1', label: 'Today' },
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: 'all', label: 'All time' },
];

const HEATMAP_DAY_THRESHOLD = 30;

function formatAxisDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function StudioStatsDetailView() {
  const isDark = useThemeStore((state) => state.dark);
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

  const label =
    range === '1'
      ? 'today'
      : range === '7'
        ? '7 days'
        : range === '30'
          ? '30 days'
          : 'all time';

  const useHeatmap = (data?.daily.length ?? 0) > HEATMAP_DAY_THRESHOLD;
  const chartLabels = useMemo(
    () =>
      (data?.daily ?? []).map((day) =>
        (data?.daily.length ?? 0) <= 7
          ? new Date(`${day.date}T12:00:00Z`).toLocaleDateString(undefined, {
              weekday: 'short',
            })
          : formatAxisDate(day.date),
      ),
    [data],
  );

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <p className="text-foreground-secondary -mb-2 text-xs">
          <Link
            to="/studio/insights"
            className="underline-offset-2 hover:underline"
          >
            ← Insights
          </Link>
        </p>
        <ViewShell title="Insights" classes={{ root: 'px-0 pt-0' }}>
          <FilterChips
            items={RANGES}
            selected={range}
            onChange={(id) => setRange(id as StatsPlaysRange)}
            aria-label="Plays time range"
          />

          {loading || !data ? (
            <StudioPanel>
              <PageLoading label="Loading plays…" />
            </StudioPanel>
          ) : (
            <>
              <StudioPanel>
                <Eyebrow>Plays — {label}</Eyebrow>
                <StatNumber className="mt-1 block text-3xl">
                  {data.totalPlays.toLocaleString()}
                </StatNumber>
                <p className="text-foreground-secondary mt-1 text-xs">
                  {data.totalDownloads.toLocaleString()} downloads
                  {data.totalSmartLinkClicks != null
                    ? `, ${data.totalSmartLinkClicks.toLocaleString()} smart-link clicks`
                    : ''}
                </p>

                {data.daily.length === 0 ? (
                  <p className="text-foreground-secondary mt-4 text-sm">
                    No daily points in this range.
                  </p>
                ) : useHeatmap ? (
                  <div className="mt-4 overflow-x-auto">
                    <CalendarHeatmap
                      days={data.daily.map((day) => ({
                        date: day.date,
                        value: day.plays,
                      }))}
                      colorScheme={isDark ? 'dark' : 'light'}
                      labels={{
                        months: monthLabelsShort(),
                        weekdays: weekdayLabelsShort(),
                        legendLess: 'Less',
                        legendMore: 'More',
                      }}
                      formatValue={(value) => `${value.toLocaleString()} plays`}
                      formatDate={formatAxisDate}
                    />
                  </div>
                ) : (
                  <div className="mt-4 h-48 w-full">
                    <DayOfWeekChart
                      values={data.daily.map((day) => day.plays)}
                      labels={{ weekdays: chartLabels }}
                      formatValue={(value) => `${value.toLocaleString()} plays`}
                    />
                  </div>
                )}
              </StudioPanel>

              {(data.downloadCountries?.length ?? 0) > 0 ? (
                <StudioPanel title="Download countries">
                  <ul className="flex flex-col gap-2 text-sm">
                    {data.downloadCountries!.map((country) => (
                      <li
                        key={country.countryCode}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>
                          {flagEmoji(country.countryCode)} {country.displayName}
                        </span>
                        <strong className="tabular-nums">
                          {country.count.toLocaleString()}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </StudioPanel>
              ) : null}
            </>
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
