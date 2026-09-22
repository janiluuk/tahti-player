import { Link, useNavigate } from '@tanstack/react-router';
import {
  BarChart3Icon,
  LayoutDashboardIcon,
  ListOrderedIcon,
} from 'lucide-react';
import { useState, type FC } from 'react';

import {
  Button,
  CalendarHeatmap,
  DayOfWeekChart,
  Dialog,
  EmptyState,
  FilterChips,
  Input,
  ListeningClock,
  TabLabel,
  Tabs,
  TopList,
  ViewShell,
} from '@tahti-player/ui';

import type {
  StatsPlaysRange,
  StatsTopListDimension,
  StatsTopListSort,
} from '../../api/studio-extras';
import { ListenerWorldMap } from '../../components/ListenerWorldMap';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { StudioPanel } from '../../components/StudioPanel';
import { Eyebrow } from '../../components/tahti/Eyebrow';
import { StatNumber } from '../../components/tahti/StatNumber';
import { countryFlagAndName } from '../../lib/countries';
import { monthLabelsShort, weekdayLabelsShort } from '../../lib/historyStats';
import {
  formatListenCount,
  formatPlayCount,
  rankingBucketTitle,
} from '../../lib/topListEntries';
import { useThemeStore } from '../../plugins/themes';
import { useStatsData } from './stats/useStatsData';

const RANGE_CHIPS: Array<{ id: StatsPlaysRange; label: string }> = [
  { id: '1', label: 'Today' },
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

type StatsTab = 'overview' | 'plays' | 'top-lists';

const STATS_TABS: Array<{
  id: StatsTab;
  label: string;
  icon: typeof LayoutDashboardIcon;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboardIcon },
  { id: 'plays', label: 'Plays & listeners', icon: BarChart3Icon },
  { id: 'top-lists', label: 'Top lists', icon: ListOrderedIcon },
];

const formatDate = (value: string) =>
  new Date(`${value}T12:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

const todayUtc = () => new Date().toISOString().slice(0, 10);

export const StudioStatsView: FC = () => {
  const navigate = useNavigate();
  const isDark = useThemeStore((state) => state.dark);
  const [activeTab, setActiveTab] = useState<StatsTab>('overview');
  const {
    range,
    setRange,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    appliedCustom,
    plays,
    tracks,
    countries,
    topLists,
    topListDimension,
    setTopListDimension,
    topListSort,
    setTopListSort,
    listenerGeo,
    live,
    grant,
    loading,
    selectedDay,
    setSelectedDay,
    hourly,
    hourlyLoading,
    topRange,
    busiestDay,
    useHeatmap,
    chartLabels,
    chartValues,
    heatmapDays,
    engagementEntries,
    keyMetrics,
    openDay,
    applyCustomRange,
  } = useStatsData();

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-6xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/stats" />
        <Tabs.Root
          selectedIndex={Math.max(
            0,
            STATS_TABS.findIndex((item) => item.id === activeTab),
          )}
          onChange={(index) => {
            const next = STATS_TABS[index];
            if (next) {
              setActiveTab(next.id);
            }
          }}
        >
          <Tabs.List className="overflow-x-auto">
            {STATS_TABS.map((item) => (
              <Tabs.Tab key={item.id}>
                <TabLabel icon={<item.icon size={14} />}>{item.label}</TabLabel>
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
        <ViewShell title="Stats" classes={{ root: 'px-0 pt-0' }}>
          <div className="mb-4 flex flex-col gap-3">
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
              aria-label="Stats time range"
            />
            {range === 'custom' ? (
              <StudioPanel className="!p-4" title="Custom period">
                <div className="flex flex-wrap items-end gap-3">
                  <Input
                    type="date"
                    label="From"
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
                    onClick={applyCustomRange}
                  >
                    Apply period
                  </Button>
                </div>
                {appliedCustom ? (
                  <p className="text-foreground-secondary mt-2 text-xs">
                    Showing {formatDate(appliedCustom.from)} –{' '}
                    {formatDate(appliedCustom.to)}
                  </p>
                ) : (
                  <p className="text-foreground-secondary mt-2 text-xs">
                    Pick dates and apply to load plays for that window.
                  </p>
                )}
              </StudioPanel>
            ) : null}
          </div>

          <section
            className={`${activeTab === 'overview' ? '' : 'hidden'} grid gap-3 sm:grid-cols-2 xl:grid-cols-3`}
            aria-label="Key metrics"
          >
            {keyMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <StudioPanel key={metric.label} className="!p-4 sm:!p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Eyebrow>{metric.label}</Eyebrow>
                    <Icon size={17} aria-hidden className="text-primary" />
                  </div>
                  <StatNumber className="mt-1 block text-3xl">
                    {loading ? '—' : metric.value.toLocaleString()}
                  </StatNumber>
                  <p className="text-foreground-secondary mt-1 text-xs">
                    {metric.note}
                  </p>
                </StudioPanel>
              );
            })}
          </section>

          <div className={activeTab === 'plays' ? 'grid gap-6' : 'hidden'}>
            <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
              <StudioPanel title="Listener map">
                <div className="mb-3 flex flex-wrap justify-between gap-2">
                  <p className="text-foreground-secondary text-sm">
                    Anonymized countries from channel listening and downloads.
                  </p>
                  <span className="text-foreground-secondary text-xs tabular-nums">
                    Peak day: {live.peakDailyListeners.toLocaleString()}{' '}
                    listeners
                  </span>
                </div>
                <ListenerWorldMap
                  data={listenerGeo}
                  loading={loading}
                  compact
                />
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
                  <BarChart3Icon
                    size={22}
                    aria-hidden
                    className="text-primary"
                  />
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

          <div
            className={`${activeTab === 'top-lists' ? '' : 'hidden'} grid gap-6 lg:grid-cols-2`}
          >
            <StudioPanel title="Content rankings" className="lg:col-span-2">
              <div className="mb-4 flex flex-wrap gap-2">
                <FilterChips
                  items={[
                    { id: 'type', label: 'By type' },
                    { id: 'genre', label: 'By genre' },
                  ]}
                  selected={topListDimension}
                  onChange={(id) =>
                    setTopListDimension(id as StatsTopListDimension)
                  }
                  aria-label="Top list grouping"
                />
                <FilterChips
                  items={[
                    { id: 'desc', label: 'Most listened' },
                    { id: 'asc', label: 'Least listened' },
                  ]}
                  selected={topListSort}
                  onChange={(id) => setTopListSort(id as StatsTopListSort)}
                  aria-label="Top list order"
                />
              </div>
              {topLists.length === 0 ? (
                <EmptyState
                  size="sm"
                  title="No listens recorded for this period yet"
                />
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {topLists.map((bucket) => (
                    <TopList
                      key={bucket.bucket}
                      title={rankingBucketTitle(bucket.bucket)}
                      formatValue={formatListenCount}
                      entries={bucket.entries.map((entry) => ({
                        id: entry.soundId,
                        label: entry.title,
                        sublabel: entry.genre ?? entry.contentType,
                        value: entry.listens,
                        onClick: () => {
                          void navigate({
                            to: '/studio/sounds/$id',
                            params: { id: entry.soundId },
                          });
                        },
                      }))}
                    />
                  ))}
                </div>
              )}
            </StudioPanel>
            <StudioPanel>
              {tracks.length === 0 ? (
                <EmptyState size="sm" title="No track stats yet" />
              ) : (
                <TopList
                  title={`Top tracks · last ${topRange} days`}
                  formatValue={formatPlayCount}
                  entries={tracks.map((track) => ({
                    id: track.soundId,
                    label: track.title,
                    value: track.plays,
                    onClick: () => {
                      void navigate({
                        to: '/studio/sounds/$id',
                        params: { id: track.soundId },
                      });
                    },
                  }))}
                />
              )}
            </StudioPanel>

            <StudioPanel>
              {countries.length === 0 ? (
                <EmptyState size="sm" title="No country data yet" />
              ) : (
                <TopList
                  title={`Top countries · last ${topRange} days`}
                  formatValue={(value) => value.toLocaleString()}
                  entries={countries.map((country) => ({
                    id: country.country,
                    label: countryFlagAndName(country.country),
                    value: country.count,
                  }))}
                />
              )}
            </StudioPanel>
          </div>

          <div className={activeTab === 'overview' ? '' : 'hidden'}>
            <StudioPanel title="Engagement units">
              <TopList
                formatValue={(value) => value.toLocaleString()}
                entries={engagementEntries}
              />
              <div className="border-border mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
                <span className="text-foreground-secondary">
                  {grant?.eligible
                    ? `Estimated ${grant.year} grant share`
                    : `Progress toward ${grant?.year ?? new Date().getFullYear()} grant eligibility`}
                </span>
                <strong>
                  {grant?.eligible
                    ? `€${((grant.estimateCents ?? 0) / 100).toFixed(2)}`
                    : `${grant?.units ?? 0} units`}
                </strong>
              </div>
            </StudioPanel>

            <p className="text-foreground-secondary text-xs">
              Fan subscription payouts and grant history remain under{' '}
              <Link
                to="/studio/audience"
                className="underline-offset-2 hover:underline"
              >
                Revenue
              </Link>
              . Listener geography is aggregated and does not identify
              individual listeners.
            </p>
          </div>
        </ViewShell>
      </div>

      <Dialog.Root
        isOpen={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        className="max-w-2xl"
      >
        <Dialog.Title>
          {selectedDay
            ? `Hourly plays · ${formatDate(selectedDay)}`
            : 'Hourly plays'}
        </Dialog.Title>
        <Dialog.Description>
          Distribution of plays across the day. Click another day on the chart
          to compare.
        </Dialog.Description>
        <div className="mt-4 min-h-48">
          {hourlyLoading ? (
            <p className="text-foreground-secondary text-sm">Loading hours…</p>
          ) : (
            <ListeningClock
              values={hourly}
              labels={{
                busiestHour: 'Busiest hour',
                busiestHourValue: 'Plays in busiest hour',
              }}
              formatValue={(value) => `${value.toLocaleString()} plays`}
              formatHour={(hour) => `${String(hour).padStart(2, '0')}:00`}
            />
          )}
        </div>
        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
    </StudioGate>
  );
};
