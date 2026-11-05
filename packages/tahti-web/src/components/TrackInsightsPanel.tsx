import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Box,
  CalendarHeatmap,
  DayOfWeekChart,
  HorizontalScroll,
  ListeningClock,
  SegmentedControl,
  StatTile,
  Tooltip,
  type SegmentedControlOption,
} from '@tahti-player/ui';

import {
  fetchTrackInsights,
  type InsightsKind,
  type InsightsPeriod,
  type TrackInsights,
} from '../api/track-insights';
import {
  formatHour,
  monthLabelsShort,
  weekdayLabelsShort,
} from '../lib/historyStats';
import { useThemeStore } from '../plugins/themes';
import { AudienceBreakdown } from '../views/studio/stats/AudienceBreakdown';
import { ListenerLocations } from '../views/studio/stats/ListenerLocations';
import { ListenerLoyalty } from '../views/studio/stats/ListenerLoyalty';
import { ReferrerSources } from '../views/studio/stats/ReferrerSources';
import { ListenerWorldMap } from './ListenerWorldMap';
import { PageEmpty, PageError, PageLoading } from './PageStates';
import { StudioPanel } from './StudioPanel';
import { StatNumber } from './tahti/StatNumber';

const PERIOD_OPTIONS: SegmentedControlOption<InsightsPeriod>[] = [
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: 'all', label: 'All time' },
];

const EMPTY_HOURS = Array.from({ length: 24 }, () => 0);
const EMPTY_WEEK: TrackInsights['dayOfWeekUsers'] = [0, 0, 0, 0, 0, 0, 0];

function formatListeners(count: number): string {
  if (count === 1) {
    return '1 listener';
  }
  return `${count.toLocaleString()} listeners`;
}

function hasAnyListeners(insights: TrackInsights): boolean {
  return (
    (insights.hourlyUsers ?? EMPTY_HOURS).some((n) => n > 0) ||
    (insights.dayOfWeekUsers ?? EMPTY_WEEK).some((n) => n > 0) ||
    (insights.dailyUsers ?? []).some((d) => d.users > 0)
  );
}

export function TrackInsightsPanel({
  kind,
  id,
}: {
  kind: InsightsKind;
  id: string;
}) {
  const { t } = useTranslation('web');
  const isDark = useThemeStore((s) => s.dark);
  const [period, setPeriod] = useState<InsightsPeriod>('30d');
  const [insights, setInsights] = useState<TrackInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchTrackInsights(kind, id, period).then((result) => {
      if (cancelled) {
        return;
      }
      setInsights(result.data);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [kind, id, period, attempt]);

  const listenWindow =
    kind === 'sound'
      ? {
          range:
            period === '7d'
              ? ('7' as const)
              : period === '30d'
                ? ('30' as const)
                : ('all' as const),
          soundId: id,
        }
      : null;

  const maxDaily = insights
    ? Math.max(1, ...insights.daily.map((day) => day.downloads))
    : 1;

  const calendarDays = useMemo(
    () =>
      (insights?.dailyUsers ?? []).map((day) => ({
        date: day.date,
        value: day.users,
      })),
    [insights],
  );

  const hourlyUsers = insights?.hourlyUsers ?? EMPTY_HOURS;
  const dayOfWeekUsers = insights?.dayOfWeekUsers ?? EMPTY_WEEK;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <SegmentedControl
          aria-label="Period"
          options={PERIOD_OPTIONS}
          value={period}
          onChange={setPeriod}
        />
      </div>

      {loading ? (
        <PageLoading label="Loading…" />
      ) : loadError && !insights ? (
        <PageError
          title="Could not load insights"
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : !insights ? (
        <PageEmpty title={t('empties.noTrackInsights')} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile
              label="Plays"
              value={
                <StatNumber className="text-2xl">
                  {insights.totalPlays.toLocaleString()}
                </StatNumber>
              }
            />
            <StatTile
              label="Downloads"
              value={
                <StatNumber className="text-2xl">
                  {insights.totalDownloads.toLocaleString()}
                </StatNumber>
              }
            />
          </div>

          {hasAnyListeners(insights) ? (
            <div
              className="@container flex flex-col gap-4"
              data-testid="track-insights-listening-patterns"
            >
              <div className="flex flex-col items-stretch gap-4 @2xl:flex-row">
                <Box
                  variant="tertiary"
                  className="h-auto w-auto flex-col gap-3"
                >
                  <h3 className="font-heading text-xl">Time of day</h3>
                  <ListeningClock
                    values={hourlyUsers}
                    labels={{
                      busiestHour: 'Busiest hour',
                      busiestHourValue: 'Listeners',
                    }}
                    formatValue={formatListeners}
                    formatHour={formatHour}
                  />
                </Box>
                <Box
                  variant="tertiary"
                  className="h-auto min-w-0 flex-1 flex-col gap-3"
                >
                  <h3 className="font-heading text-xl">Day of week</h3>
                  <div className="relative min-h-48 w-full flex-1">
                    <div className="absolute inset-0">
                      <DayOfWeekChart
                        values={dayOfWeekUsers}
                        labels={{ weekdays: weekdayLabelsShort() }}
                        formatValue={formatListeners}
                      />
                    </div>
                  </div>
                </Box>
              </div>

              <Box variant="tertiary" className="min-w-0 flex-col gap-3">
                <h3 className="font-heading text-xl">Listening calendar</h3>
                <HorizontalScroll
                  label="Listening calendar"
                  className="[direction:rtl]"
                >
                  <CalendarHeatmap
                    className="mx-auto w-fit [direction:ltr]"
                    days={calendarDays}
                    labels={{
                      months: monthLabelsShort(),
                      weekdays: weekdayLabelsShort(),
                      legendLess: 'Fewer listeners',
                      legendMore: 'More listeners',
                    }}
                    colorScheme={isDark ? 'dark' : 'light'}
                    formatValue={formatListeners}
                    formatDate={(date) =>
                      new Date(`${date}T00:00:00Z`).toLocaleDateString(
                        undefined,
                        { dateStyle: 'full', timeZone: 'UTC' },
                      )
                    }
                  />
                </HorizontalScroll>
              </Box>
            </div>
          ) : (
            <PageEmpty
              data-testid="track-insights-listening-empty"
              title="No listening patterns yet"
              description="When people play this track, time of day, weekday and calendar charts will fill in here."
            />
          )}

          <StudioPanel title="Listener map">
            <p className="text-foreground-secondary mb-4 text-sm">
              Anonymized countries for this track&apos;s counted plays and
              downloads.
            </p>
            <ListenerWorldMap data={insights.countries} countLabel="plays" />
            {listenWindow ? <ListenerLocations window={listenWindow} /> : null}
          </StudioPanel>

          <StudioPanel title="Downloads by day">
            {insights.daily.length === 0 ? (
              <PageEmpty title={t('empties.noDownloadsPeriod')} />
            ) : (
              <div className="flex h-32 items-end gap-1">
                {insights.daily.map((day) => (
                  <Tooltip
                    key={day.date}
                    content={`${day.date}: ${day.downloads}`}
                    side="top"
                    wrapperClassName="group relative flex h-full flex-1 items-end"
                  >
                    <div
                      className="bg-primary hover:bg-accent-cyan w-full rounded-t transition-colors"
                      style={{
                        height: `${Math.max(4, (day.downloads / maxDaily) * 100)}%`,
                      }}
                    />
                  </Tooltip>
                ))}
              </div>
            )}
          </StudioPanel>

          {listenWindow ? (
            <>
              <ListenerLoyalty window={listenWindow} />
              <ReferrerSources window={listenWindow} />
              <AudienceBreakdown window={listenWindow} />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
