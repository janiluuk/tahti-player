import { BarChart3Icon } from 'lucide-react';

import { CalendarHeatmap, DayOfWeekChart } from '@tahti-player/ui';

import { ListenerWorldMap } from '../../../components/ListenerWorldMap';
import { StudioPanel } from '../../../components/StudioPanel';
import { StatNumber } from '../../../components/tahti/StatNumber';
import {
  monthLabelsShort,
  weekdayLabelsShort,
} from '../../../lib/historyStats';
import { useThemeStore } from '../../../plugins/themes';
import { formatDate } from './helpers';
import type { StatsData } from './useStatsData';

export function PlaysTab({
  state,
  active,
}: {
  state: StatsData;
  active: boolean;
}) {
  const isDark = useThemeStore((s) => s.dark);
  const {
    listenerGeo,
    loading,
    live,
    plays,
    busiestDay,
    useHeatmap,
    heatmapDays,
    chartLabels,
    chartValues,
    openDay,
  } = state;

  return (
    <div className={active ? 'grid gap-6' : 'hidden'}>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <StudioPanel title="Listener map">
          <div className="mb-3 flex flex-wrap justify-between gap-2">
            <p className="text-foreground-secondary text-sm">
              Anonymized countries from channel listening and downloads.
            </p>
            <span className="text-foreground-secondary text-xs tabular-nums">
              Peak day: {live.peakDailyListeners.toLocaleString()} listeners
            </span>
          </div>
          <ListenerWorldMap data={listenerGeo} loading={loading} compact />
        </StudioPanel>

        <StudioPanel title="Plays over time">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <StatNumber className="block text-3xl">
                {plays.totalPlays.toLocaleString()}
              </StatNumber>
              <p className="text-foreground-secondary text-xs">
                {busiestDay
                  ? `Busiest day: ${formatDate(busiestDay.date)} · ${busiestDay.plays.toLocaleString()} plays`
                  : 'Daily activity appears after your first play.'}
              </p>
            </div>
            <BarChart3Icon size={22} aria-hidden className="text-primary" />
          </div>
          {plays.daily.length === 0 ? (
            <p className="text-foreground-secondary text-sm">
              No plays in this period.
            </p>
          ) : useHeatmap ? (
            <div className="overflow-x-auto">
              <CalendarHeatmap
                days={heatmapDays}
                colorScheme={isDark ? 'dark' : 'light'}
                labels={{
                  months: monthLabelsShort(),
                  weekdays: weekdayLabelsShort(),
                  legendLess: 'Less',
                  legendMore: 'More',
                }}
                formatValue={(value) => `${value.toLocaleString()} plays`}
                formatDate={formatDate}
                onDayClick={openDay}
              />
            </div>
          ) : (
            <div className="h-52 w-full">
              <DayOfWeekChart
                values={chartValues}
                labels={{ weekdays: chartLabels }}
                formatValue={(value) => `${value.toLocaleString()} plays`}
                onBarClick={(index) => {
                  const day = plays.daily[index];
                  if (day) {
                    openDay(day.date);
                  }
                }}
              />
            </div>
          )}
          <p className="text-foreground-secondary mt-2 text-xs">
            Click a day for hourly listening.
          </p>
        </StudioPanel>
      </div>
    </div>
  );
}
