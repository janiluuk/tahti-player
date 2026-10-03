import { useEffect, useState } from 'react';

import { StatTile } from '@tahti-player/ui';

import {
  fetchReleaseSmartLinkAnalytics,
  type ReleaseSmartLinkAnalytics,
} from '../../../api/release-analytics';
import { StudioPanel } from '../../../components/StudioPanel';
import { dspServiceLabel } from '../../../lib/dspServices';

export function ReleaseSmartLinkStats({ releaseId }: { releaseId: string }) {
  const [stats, setStats] = useState<ReleaseSmartLinkAnalytics | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchReleaseSmartLinkAnalytics(releaseId).then((result) => {
      if (!cancelled) {
        setStats(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [releaseId]);

  if (!stats) {
    return null;
  }

  const platforms = Object.entries(stats.clicksByPlatform).sort(
    ([, a], [, b]) => b - a,
  );
  const clickRate =
    stats.smartLinkViewCount > 0
      ? Math.round((stats.totalClicks / stats.smartLinkViewCount) * 100)
      : null;

  return (
    <StudioPanel
      title="Smart link stats"
      description="Visits to this release's smart link and clicks through to each service."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Views"
          value={stats.smartLinkViewCount.toLocaleString()}
        />
        <StatTile label="Clicks" value={stats.totalClicks.toLocaleString()} />
        <StatTile
          label="Click-through"
          value={clickRate === null ? '—' : `${clickRate}%`}
        />
      </div>
      {platforms.length > 0 ? (
        <ul
          className="mt-4 flex flex-col gap-1.5 text-sm"
          data-testid="smart-link-clicks"
        >
          {platforms.map(([platform, count]) => (
            <li
              key={platform}
              className="flex items-center justify-between gap-3"
            >
              <span>{dspServiceLabel(platform)}</span>
              <span className="tabular-nums">{count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </StudioPanel>
  );
}
