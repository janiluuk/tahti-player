import { useMemo, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Box,
  CalendarHeatmap,
  cn,
  DayOfWeekChart,
  HorizontalScroll,
  ListeningClock,
  Select,
  TopList,
} from '@tahti-player/ui';

import {
  dailyListeningMs,
  dayOfWeekListeningMs,
  entriesInRange,
  formatHour,
  formatListeningDuration,
  hourlyListeningMs,
  monthLabelsShort,
  rangeDisplayBounds,
  rangePresets,
  topArtists,
  topChannels,
  topTracks,
  weekdayLabelsShort,
  type RangePresetId,
} from '../../lib/historyStats';
import { dateLocaleTag } from '../../lib/locale';
import { numericDate } from '../../lib/relativeDate';
import { useThemeStore } from '../../plugins/themes';
import type { HistoryEntry } from '../../stores/libraryStore';
import { PageEmpty } from '../PageStates';

const TOP_LIST_SIZE = 10;

function StatsTopList({
  testId,
  title,
  entries,
  className,
}: {
  testId: string;
  title: string;
  entries: ReturnType<typeof topTracks>;
  className?: string;
}) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <Box variant="tertiary" className={cn('min-w-0 flex-col', className)}>
      <TopList
        data-testid={testId}
        title={title}
        entries={entries}
        formatValue={formatListeningDuration}
      />
    </Box>
  );
}

export function HistoryStatsSection({ history }: { history: HistoryEntry[] }) {
  const { t } = useTranslation('web');
  const isDark = useThemeStore((s) => s.dark);
  const [presetId, setPresetId] = useState<RangePresetId>('last30Days');

  const ranged = useMemo(
    () => entriesInRange(history, presetId),
    [history, presetId],
  );

  const dailyDays = useMemo(() => dailyListeningMs(history), [history]);
  const hourlyValues = useMemo(() => hourlyListeningMs(ranged), [ranged]);
  const dayOfWeekValues = useMemo(() => dayOfWeekListeningMs(ranged), [ranged]);
  const hasListening = ranged.length > 0;

  const artists = useMemo(() => topArtists(ranged, TOP_LIST_SIZE), [ranged]);
  const channels = useMemo(() => topChannels(ranged, TOP_LIST_SIZE), [ranged]);
  const tracks = useMemo(() => topTracks(ranged, TOP_LIST_SIZE), [ranged]);
  const hasTopLists =
    artists.length > 0 || channels.length > 0 || tracks.length > 0;
  const rangeBounds = useMemo(
    () => rangeDisplayBounds(history, presetId),
    [history, presetId],
  );
  const rangeDates = rangeBounds
    ? `${numericDate(new Date(rangeBounds.from))} – ${numericDate(new Date(rangeBounds.to))}`
    : null;

  if (history.length === 0) {
    return (
      <PageEmpty
        data-testid="history-stats-empty"
        title={t('library.historyStatsEmptyTitle')}
        description={t('library.historyStatsEmptyDescription')}
        className="flex-1"
      />
    );
  }

  return (
    <div
      data-testid="history-stats"
      className="@container flex flex-col gap-4 py-4"
    >
      <div className="flex items-center justify-end gap-3">
        {rangeDates && (
          <span
            data-testid="history-stats-range-dates"
            className="text-foreground-secondary text-sm"
          >
            {rangeDates}
          </span>
        )}
        <div data-testid="history-stats-range" className="w-44">
          <Select
            aria-label={t('library.dateRange')}
            options={rangePresets(t).map((p) => ({ id: p.id, label: p.label }))}
            value={presetId}
            onValueChange={(value) => setPresetId(value as RangePresetId)}
          />
        </div>
      </div>

      {hasTopLists && (
        <div className="grid grid-cols-1 items-start gap-4 @2xl:grid-cols-2">
          <StatsTopList
            testId="history-top-artists"
            title={t('library.topArtists')}
            entries={artists}
          />
          <StatsTopList
            testId="history-top-tracks"
            title={t('library.topTracks')}
            entries={tracks}
          />
          <StatsTopList
            testId="history-top-channels"
            title={t('library.topChannels')}
            entries={channels}
            className="@2xl:col-span-2"
          />
        </div>
      )}

      {hasListening ? (
        <div className="flex flex-col items-stretch gap-4 @2xl:flex-row">
          <Box variant="tertiary" className="h-auto w-auto flex-col gap-3">
            <h3 className="font-heading text-xl">{t('library.timeOfDay')}</h3>
            <ListeningClock
              values={hourlyValues}
              labels={{
                busiestHour: t('library.busiestHour'),
                busiestHourValue: t('library.listeningTime'),
              }}
              formatValue={formatListeningDuration}
              formatHour={formatHour}
            />
          </Box>
          <Box
            variant="tertiary"
            className="h-auto min-w-0 flex-1 flex-col gap-3"
          >
            <h3 className="font-heading text-xl">{t('library.dayOfWeek')}</h3>
            {/* recharts' ResponsiveContainer needs a definite height; the
                absolute layer gives it one while the box stretches to match
                the clock beside it. */}
            <div className="relative min-h-48 w-full flex-1">
              <div className="absolute inset-0">
                <DayOfWeekChart
                  values={dayOfWeekValues}
                  labels={{ weekdays: weekdayLabelsShort() }}
                  formatValue={formatListeningDuration}
                />
              </div>
            </div>
          </Box>
        </div>
      ) : (
        <PageEmpty
          data-testid="history-stats-empty"
          title={t('library.historyStatsEmptyRangeTitle')}
          description={t('library.historyStatsEmptyRangeDescription')}
          className="flex-1"
        />
      )}

      <Box variant="tertiary" className="min-w-0 flex-col gap-3">
        <h3 className="font-heading text-xl">
          {t('library.listeningCalendar')}
        </h3>
        {/* An rtl scroller starts at its right edge, so a pane too narrow
            for the whole year opens on the most recent weeks. */}
        <HorizontalScroll
          label={t('library.listeningCalendar')}
          className="[direction:rtl]"
        >
          <CalendarHeatmap
            className="mx-auto w-fit [direction:ltr]"
            days={dailyDays}
            labels={{
              months: monthLabelsShort(),
              weekdays: weekdayLabelsShort(),
              legendLess: t('library.legendLess'),
              legendMore: t('library.legendMore'),
            }}
            colorScheme={isDark ? 'dark' : 'light'}
            formatValue={formatListeningDuration}
            formatDate={(date) =>
              new Date(`${date}T00:00:00`).toLocaleDateString(dateLocaleTag(), {
                dateStyle: 'full',
              })
            }
          />
        </HorizontalScroll>
      </Box>
    </div>
  );
}
