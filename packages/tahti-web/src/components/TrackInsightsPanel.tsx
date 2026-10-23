import { useEffect, useState } from 'react';

import {
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
import { ListenerWorldMap } from './ListenerWorldMap';
import { PageEmpty, PageError, PageLoading } from './PageStates';
import { StudioPanel } from './StudioPanel';
import { StatNumber } from './tahti/StatNumber';

const PERIOD_OPTIONS: SegmentedControlOption<InsightsPeriod>[] = [
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: 'all', label: 'All time' },
];

export function TrackInsightsPanel({
  kind,
  id,
}: {
  kind: InsightsKind;
  id: string;
}) {
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

  const maxDaily = insights
    ? Math.max(1, ...insights.daily.map((day) => day.downloads))
    : 1;

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
        <PageEmpty title="No insights for this track yet" />
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

          <StudioPanel title="Listener map">
            <p className="text-foreground-secondary mb-4 text-sm">
              Anonymized countries for this track's counted plays and downloads.
            </p>
            <ListenerWorldMap data={insights.countries} countLabel="plays" />
          </StudioPanel>

          <StudioPanel title="Downloads by day">
            {insights.daily.length === 0 ? (
              <PageEmpty title="No downloads in this period" />
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
        </>
      )}
    </div>
  );
}
