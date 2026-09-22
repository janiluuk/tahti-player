import {
  AudioLinesIcon,
  DownloadIcon,
  ExternalLinkIcon,
  RadioTowerIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { fetchGrantEstimate, type GrantEstimate } from '../../../api/revenue';
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
} from '../../../api/studio-extras';

export const HEATMAP_DAY_THRESHOLD = 30;

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

/** Loads and derives every number shown on the Stats view. */
export function useStatsData() {
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

  // Top tracks/countries/lists only support 7/30/90-day windows; "Custom" and
  // "1 day" fall back to the last 30 days (and the panel titles say so).
  const topRange = range === 'custom' || range === '1' ? '30' : range;

  // Everything except the top lists: re-fetched only when the range changes.
  useEffect(() => {
    if (!playsQueryReady) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    const geoPeriod =
      range === '1' || range === '7' ? '7d' : range === '30' ? '30d' : 'all';
    Promise.all([
      fetchStatsSummary(),
      fetchStatsPlays(
        range === 'custom' && appliedCustom
          ? { range: 'custom', from: appliedCustom.from, to: appliedCustom.to }
          : range,
      ),
      fetchStatsTopTracks(topRange),
      fetchStatsTopCountries(topRange),
      fetchListenerGeo(geoPeriod),
      fetchChannelEgressStats(),
      fetchChannelLiveStats(),
      fetchGrantEstimate(),
    ])
      .then(
        ([
          summaryResult,
          playsResult,
          tracksResult,
          countriesResult,
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
          setListenerGeo(listenerGeoResult.data);
          setEgress(egressResult.data);
          setLive(liveResult.data);
          setGrant(grantResult.data);
        },
      )
      .catch(() => {
        if (!cancelled) {
          toast.error('Could not load your stats.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [range, appliedCustom, topRange, playsQueryReady]);

  // The top lists alone re-fetch when their dimension or sort changes.
  useEffect(() => {
    let cancelled = false;
    fetchStatsTopLists(topRange, topListDimension, topListSort)
      .then((result) => {
        if (!cancelled) {
          setTopLists(result.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Could not load the top lists.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [topRange, topListDimension, topListSort]);

  useEffect(() => {
    if (!selectedDay) {
      setHourly([]);
      return;
    }
    let cancelled = false;
    setHourlyLoading(true);
    fetchStatsPlaysHourly(selectedDay)
      .then((result) => {
        if (!cancelled) {
          setHourly(result.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Could not load the hourly breakdown.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHourlyLoading(false);
        }
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
      note: `Estimated from ${egress.windowDays}d delivery at 192 kbps`,
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

  return {
    range,
    setRange,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    appliedCustom,
    summary,
    plays,
    tracks,
    countries,
    topLists,
    topListDimension,
    setTopListDimension,
    topListSort,
    setTopListSort,
    listenerGeo,
    egress,
    live,
    grant,
    loading,
    selectedDay,
    setSelectedDay,
    hourly,
    hourlyLoading,
    topRange,
    busiestDay,
    minutesListened,
    minutesStreamed,
    useHeatmap,
    chartLabels,
    chartValues,
    heatmapDays,
    engagementEntries,
    keyMetrics,
    openDay,
    applyCustomRange,
  };
}

export type StatsData = ReturnType<typeof useStatsData>;
