import { useTranslation } from '@tahti-player/i18n';
import { Button, FilterChips, Input } from '@tahti-player/ui';

import type { StatsPlaysRange } from '../../../api/studio-extras';
import { StudioPanel } from '../../../components/StudioPanel';
import { formatDate, todayUtc } from './helpers';
import type { StatsData } from './useStatsData';

const RANGE_CHIPS: Array<{ id: StatsPlaysRange; label: string }> = [
  { id: '1', label: 'Today' },
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

export function RangeControls({ state }: { state: StatsData }) {
  const { t } = useTranslation('web');
  const {
    range,
    setRange,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    appliedCustom,
    applyCustomRange,
  } = state;

  return (
    <div className="flex flex-col gap-3">
      <FilterChips
        items={RANGE_CHIPS}
        selected={range}
        onChange={(id) => {
          const next = id as StatsPlaysRange;
          setRange(next);
          if (next === 'custom' && !customFrom && !customTo) {
            const end = todayUtc();
            const startDate = new Date();
            startDate.setUTCDate(startDate.getUTCDate() - 13);
            const start = startDate.toISOString().slice(0, 10);
            setCustomFrom(start);
            setCustomTo(end);
          }
        }}
        aria-label={t('statsRange.statsTimeRange')}
      />
      {range === 'custom' ? (
        <StudioPanel className="!p-4" title={t('statsRange.customPeriod')}>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              applyCustomRange();
            }}
          >
            <Input
              type="date"
              label={t('statsRange.from')}
              value={customFrom}
              max={customTo || todayUtc()}
              onChange={(event) => setCustomFrom(event.target.value)}
            />
            <Input
              type="date"
              label="To"
              value={customTo}
              min={customFrom || undefined}
              max={todayUtc()}
              onChange={(event) => setCustomTo(event.target.value)}
            />
            <Button
              size="sm"
              disabled={!customFrom || !customTo || customTo < customFrom}
              type="submit"
            >
              {t('statsRange.applyPeriod')}
            </Button>
          </form>
          {appliedCustom ? (
            <p className="text-foreground-secondary mt-2 text-xs">
              Showing {formatDate(appliedCustom.from)} –{' '}
              {formatDate(appliedCustom.to)}
            </p>
          ) : (
            <p className="text-foreground-secondary mt-2 text-xs">
              {t('statsRange.pickDatesAndApplyTo')}
            </p>
          )}
        </StudioPanel>
      ) : null}
    </div>
  );
}
