import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import {
  SegmentedControl,
  StatTile,
  TopList,
  type SegmentedControlOption,
} from '@tahti-player/ui';

import type { StudioReleaseTrack } from '../../../api/studio-types';
import {
  fetchTrackInsights,
  type InsightsPeriod,
  type TrackInsights,
} from '../../../api/track-insights';
import { ListenerWorldMap } from '../../../components/ListenerWorldMap';
import { PageEmpty, PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { StatNumber } from '../../../components/tahti/StatNumber';
import { formatPlayCount } from '../../../lib/topListEntries';

const PERIOD_OPTIONS: SegmentedControlOption<InsightsPeriod>[] = [
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: 'all', label: 'All time' },
];

type TrackStats = { track: StudioReleaseTrack; insights: TrackInsights | null };

/** Release-wide totals built from each track's own insights; the API has
 * no release-level stats query, and a release has few tracks. */
export function ReleaseStatsPanel({
  tracks,
}: {
  tracks: StudioReleaseTrack[];
}) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<InsightsPeriod>('30d');
  const [stats, setStats] = useState<TrackStats[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    void Promise.all(
      tracks.map(async (track) => ({
        track,
        insights: (await fetchTrackInsights('release-tracks', track.id, period))
          .data,
      })),
    ).then((result) => {
      if (!cancelled) {
        setStats(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tracks, period]);

  const totals = useMemo(() => {
    const countries = new Map<
      string,
      { countryCode: string; displayName: string; count: number }
    >();
    let plays = 0;
    let downloads = 0;
    for (const { insights } of stats ?? []) {
      if (!insights) {
        continue;
      }
      plays += insights.totalPlays;
      downloads += insights.totalDownloads;
      for (const country of insights.countries) {
        const entry = countries.get(country.countryCode);
        countries.set(country.countryCode, {
          ...country,
          count: (entry?.count ?? 0) + country.count,
        });
      }
    }
    return { plays, downloads, countries: [...countries.values()] };
  }, [stats]);

  const ranked = useMemo(
    () =>
      [...(stats ?? [])].sort(
        (a, b) => (b.insights?.totalPlays ?? 0) - (a.insights?.totalPlays ?? 0),
      ),
    [stats],
  );

  if (tracks.length === 0) {
    return (
      <PageEmpty
        title="No tracks yet"
        description="Add tracks to this release to see its stats."
      />
    );
  }

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

      {stats === null ? (
        <PageLoading label="Loading…" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile
              label="Plays"
              value={
                <StatNumber className="text-2xl">
                  {totals.plays.toLocaleString()}
                </StatNumber>
              }
            />
            <StatTile
              label="Downloads"
              value={
                <StatNumber className="text-2xl">
                  {totals.downloads.toLocaleString()}
                </StatNumber>
              }
            />
          </div>

          <StudioPanel>
            <TopList
              title="Tracks by plays"
              formatValue={formatPlayCount}
              entries={ranked.map(({ track, insights }) => ({
                id: track.id,
                label: track.title,
                sublabel: insights
                  ? `${insights.totalDownloads.toLocaleString()} downloads`
                  : 'No stats yet',
                value: insights?.totalPlays ?? 0,
                onClick: () => {
                  void navigate({
                    to: '/studio/insights/$kind/$id',
                    params: { kind: 'release-tracks', id: track.id },
                  });
                },
              }))}
            />
          </StudioPanel>

          <StudioPanel title="Listener map">
            <p className="text-foreground-secondary mb-4 text-sm">
              Anonymized countries for this release's counted plays and
              downloads.
            </p>
            <ListenerWorldMap data={totals.countries} countLabel="plays" />
          </StudioPanel>
        </>
      )}
    </div>
  );
}
