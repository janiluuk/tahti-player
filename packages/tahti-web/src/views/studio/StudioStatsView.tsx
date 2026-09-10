import { Link, useNavigate } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  BarChart3Icon,
  DownloadIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  RadioTowerIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FC } from 'react';

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

import { fetchGrantEstimate, type GrantEstimate } from '../../api/revenue';
import {
  fetchChannelEgressStats,
  fetchChannelLiveStats,
  fetchListenerGeo,
  fetchStatsPlays,
  fetchStatsPlaysHourly,
  fetchStatsSummary,
  fetchStatsTopCountries,
  fetchStatsTopLists,
  fetchStatsTopTracks,
  type ChannelEgressStats,
  type ChannelLiveStats,
  type ListenerGeoPoint,
  type StatsPlays,
  type StatsPlaysRange,
  type StatsSummary,
  type StatsTopCountry,
  type StatsTopListBucket,
  type StatsTopListDimension,
  type StatsTopListSort,
  type StatsTopTrack,
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

const RANGE_CHIPS: Array<{ id: StatsPlaysRange; label: string }> = [
  { id: '1', label: 'Today' },
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

const HEATMAP_DAY_THRESHOLD = 30;

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

const EMPTY_SUMMARY: StatsSummary = {
  playsToday: 0,
  playsTotal: 0,
  downloadsToday: 0,
  downloadsTotal: 0,
  followerCount: 0,
};

const EMPTY_PLAYS: StatsPlays = {
  totalPlays: 0,
  totalDownloads: 0,
  totalSmartLinkClicks: 0,
  daily: [],
};

const EMPTY_EGRESS: ChannelEgressStats = {
  windowDays: 30,
  liveHlsBytes: 0,
  estimatedLiveHlsBytes: 0,
};

const EMPTY_LIVE: ChannelLiveStats = {
  windowDays: 14,
  totalLiveSeconds: 0,
  totalBroadcasts: 0,
  peakDailyListeners: 0,
};

const formatDate = (value: string) =>
  new Date(`${value}T12:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

const formatBarLabel = (value: string, totalDays: number) => {
  const date = new Date(`${value}T12:00:00Z`);
  if (totalDays <= 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }
  if (totalDays <= 14) {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }
  return String(date.getUTCDate());
};

const todayUtc = () => new Date().toISOString().slice(0, 10);

export const StudioStatsView: FC = () => {
  const navigate = useNavigate();
  const isDark = useThemeStore((state) => state.dark);
  const [activeTab, setActiveTab] = useState<StatsTab>('overview');
  const [range, setRange] = useState<StatsPlaysRange>('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedCustom, setAppliedCustom] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [summary, setSummary] = useState<StatsSummary>(EMPTY_SUMMARY);
  const [plays, setPlays] = useState<StatsPlays>(EMPTY_PLAYS);
  const [tracks, setTracks] = useState<StatsTopTrack[]>([]);
  const [countries, setCountries] = useState<StatsTopCountry[]>([]);
  const [topLists, setTopLists] = useState<StatsTopListBucket[]>([]);
  const [topListDimension, setTopListDimension] =
    useState<StatsTopListDimension>('type');
  const [topListSort, setTopListSort] = useState<StatsTopListSort>('desc');
  const [listenerGeo, setListenerGeo] = useState<ListenerGeoPoint[]>([]);
  const [egress, setEgress] = useState<ChannelEgressStats>(EMPTY_EGRESS);
  const [live, setLive] = useState<ChannelLiveStats>(EMPTY_LIVE);
  const [grant, setGrant] = useState<GrantEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [hourly, setHourly] = useState<number[]>([]);
  const [hourlyLoading, setHourlyLoading] = useState(false);

  const playsQueryReady =
    range !== 'custom' || Boolean(appliedCustom?.from && appliedCustom?.to);

  useEffect(() => {
    if (!playsQueryReady) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    const apiRange = range === 'custom' ? 'custom' : range;
    const geoPeriod =
      range === '1' || range === '7' ? '7d' : range === '30' ? '30d' : 'all';
    void Promise.all([
      fetchStatsSummary(),
      fetchStatsPlays(
        range === 'custom' && appliedCustom
          ? { range: 'custom', from: appliedCustom.from, to: appliedCustom.to }
          : apiRange,
      ),
      fetchStatsTopTracks(range === 'custom' || range === '1' ? '30' : range),
      fetchStatsTopCountries(
        range === 'custom' || range === '1' ? '30' : range,
      ),
      fetchStatsTopLists(
        range === 'custom' || range === '1' ? '30' : range,
        topListDimension,
        topListSort,
      ),
      fetchListenerGeo(geoPeriod),
      fetchChannelEgressStats(),
      fetchChannelLiveStats(),
      fetchGrantEstimate(),
    ]).then(
      ([
        summaryResult,
        playsResult,
        tracksResult,
        countriesResult,
        topListsResult,
        listenerGeoResult,
        egressResult,
        liveResult,
        grantResult,
      ]) => {
        if (cancelled) {
          return;
        }
        setSummary(summaryResult.data);
        setPlays(playsResult.data);
        setTracks(tracksResult.data);
        setCountries(countriesResult.data);
        setTopLists(topListsResult.data);
        setListenerGeo(listenerGeoResult.data);
        setEgress(egressResult.data);
        setLive(liveResult.data);
        setGrant(grantResult.data);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [range, appliedCustom, topListDimension, topListSort, playsQueryReady]);

  useEffect(() => {
    if (!selectedDay) {
      setHourly([]);
      return;
    }
    let cancelled = false;
    setHourlyLoading(true);
    void fetchStatsPlaysHourly(selectedDay).then((result) => {
      if (cancelled) {
        return;
      }
      setHourly(result.data);
      setHourlyLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDay]);

  const busiestDay = useMemo(
    () =>
      plays.daily.length > 0
        ? plays.daily.reduce((best, day) =>
            day.plays > best.plays ? day : best,
          )
        : null,
    [plays.daily],
  );
  const deliveredBytes = egress.liveHlsBytes || egress.estimatedLiveHlsBytes;
  const minutesListened = Math.round((deliveredBytes * 8) / 192_000 / 60);
  const minutesStreamed = Math.round(live.totalLiveSeconds / 60);
  const useHeatmap = plays.daily.length > HEATMAP_DAY_THRESHOLD;
  const chartLabels = useMemo(
    () =>
      plays.daily.map((day) => formatBarLabel(day.date, plays.daily.length)),
    [plays.daily],
  );
  const chartValues = useMemo(
    () => plays.daily.map((day) => day.plays),
    [plays.daily],
  );
  const heatmapDays = useMemo(
    () => plays.daily.map((day) => ({ date: day.date, value: day.plays })),
    [plays.daily],
  );

  const engagementEntries = [
    {
      id: 'free-downloads',
      label: 'Free downloads',
      sublabel: `${grant?.freeDownloads ?? 0} × 1`,
      value: grant?.freeDownloads ?? 0,
    },
    {
      id: 'paid-downloads',
      label: 'Paid downloads',
      sublabel: `${grant?.paidDownloads ?? 0} × 5`,
      value: (grant?.paidDownloads ?? 0) * 5,
    },
    {
      id: 'fan-subs',
      label: 'Fan subscriptions',
      sublabel: `€${grant?.fanSubEuros ?? 0} × 1`,
      value: grant?.fanSubEuros ?? 0,
    },
  ];

  const keyMetrics = [
    {
      label: 'Plays',
      value: plays.totalPlays,
      note: `${summary.playsToday.toLocaleString()} today`,
      icon: AudioLinesIcon,
    },
    {
      label: 'Downloads',
      value: plays.totalDownloads,
      note: `${summary.downloadsToday.toLocaleString()} today`,
      icon: DownloadIcon,
    },
    {
      label: 'Smart-link clicks',
      value: plays.totalSmartLinkClicks ?? 0,
      note: 'Selected period',
      icon: ExternalLinkIcon,
    },
    {
      label: 'Followers',
      value: summary.followerCount,
      note: 'Current audience',
      icon: UsersIcon,
    },
    {
      label: 'Minutes listened',
      value: minutesListened,
      note: `Estimated from ${egress.windowDays}d delivery`,
      icon: UsersIcon,
    },
    {
      label: 'Minutes streamed',
      value: minutesStreamed,
      note: `${live.totalBroadcasts} broadcasts in ${live.windowDays}d`,
      icon: RadioTowerIcon,
    },
  ];

  const openDay = (date: string) => setSelectedDay(date);

  const applyCustomRange = () => {
    if (!customFrom || !customTo || customTo < customFrom) {
      return;
    }
    setAppliedCustom({ from: customFrom, to: customTo });
    setRange('custom');
  };

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
                  title="Top tracks"
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
                  title="Top countries"
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
