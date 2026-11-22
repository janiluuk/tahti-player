import { DownloadIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  CalendarHeatmap,
  DayOfWeekChart,
  HorizontalScroll,
} from '@tahti-player/ui';

import { PageEmpty } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { StatNumber } from '../../../components/tahti/StatNumber';
import {
  monthLabelsShort,
  weekdayLabelsShort,
} from '../../../lib/historyStats';
import { dateLocaleTag } from '../../../lib/locale';
import { useThemeStore } from '../../../plugins/themes';
import { downloadPlaysCsv, formatDate } from './helpers';
import type { StatsData } from './useStatsData';

export function PlaysTab({ state }: { state: StatsData }) {
  const { t } = useTranslation('web');
  const isDark = useThemeStore((s) => s.dark);
  const {
    plays,
    busiestDay,
    useHeatmap,
    heatmapDays,
    chartLabels,
    chartValues,
    openDay,
  } = state;
  const splitDaily =
    plays.daily.length > 0 &&
    plays.daily.every(
      (day) => day.downloads != null && day.smartLinkClicks != null,
    );

  return (
    <StudioPanel title={t('playsTab.playsOverTime')}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <StatNumber className="block text-3xl">
            {plays.totalPlays.toLocaleString(dateLocaleTag())}
          </StatNumber>
          <p className="text-foreground-secondary text-xs">
            {busiestDay
              ? t('playsTabBatch32.busiestDay', {
                  count: busiestDay.plays,
                  date: formatDate(busiestDay.date),
                  formatted: busiestDay.plays.toLocaleString(dateLocaleTag()),
                })
              : t('playsTabBatch32.dailyActivityEmpty')}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={plays.daily.length === 0}
          onClick={() => downloadPlaysCsv(plays.daily)}
        >
          <DownloadIcon size={14} aria-hidden />
          <span className="ml-1.5">{t('playsTab.downloadCsv')}</span>
        </Button>
      </div>
      {plays.daily.length === 0 ? (
        <PageEmpty title={t('empties.noPlaysPeriod')} />
      ) : useHeatmap ? (
        <HorizontalScroll label={t('playsTab.dailyPlays')}>
          <CalendarHeatmap
            days={heatmapDays}
            colorScheme={isDark ? 'dark' : 'light'}
            labels={{
              months: monthLabelsShort(),
              weekdays: weekdayLabelsShort(),
              legendLess: t('library.legendLess'),
              legendMore: t('library.legendMore'),
            }}
            formatValue={(value) =>
              t('playsTabBatch32.playsValue', {
                count: value,
                formatted: value.toLocaleString(dateLocaleTag()),
              })
            }
            formatDate={formatDate}
            onDayClick={openDay}
          />
        </HorizontalScroll>
      ) : (
        <div className="h-52 w-full">
          <DayOfWeekChart
            values={
              splitDaily
                ? plays.daily.map((day) => day.downloads ?? 0)
                : chartValues
            }
            stackValues={
              splitDaily
                ? plays.daily.map((day) => day.smartLinkClicks ?? 0)
                : undefined
            }
            labels={{ weekdays: chartLabels }}
            formatValue={(value) =>
              t('playsTabBatch32.playsValue', {
                count: value,
                formatted: value.toLocaleString(dateLocaleTag()),
              })
            }
            onBarClick={(index) => {
              const day = plays.daily[index];
              if (day) {
                openDay(day.date);
              }
            }}
          />
        </div>
      )}
      {splitDaily && !useHeatmap && plays.daily.length > 0 ? (
        <ul
          className="text-foreground-secondary mt-2 flex flex-wrap gap-4 text-xs"
          aria-label={t('playsTab.chartLegend')}
        >
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="bg-primary size-2.5 rounded-sm" />
            {t('playsTab.downloads')}
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="bg-accent-yellow size-2.5 rounded-sm"
            />
            {t('playsTab.smartLinkClicks')}
          </li>
        </ul>
      ) : null}
      <p className="text-foreground-secondary mt-2 text-xs">
        {t('playsTab.clickADayForHourly')}
      </p>
    </StudioPanel>
  );
}
