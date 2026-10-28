import { ExternalLinkIcon, EyeIcon, PercentIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { StatTile } from '@tahti-player/ui';

import {
  fetchReleaseSmartLinkAnalytics,
  type ReleaseSmartLinkAnalytics,
} from '../../../api/release-analytics';
import { PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { dspServiceLabel } from '../../../lib/dspServices';
import { STUDIO_METRIC_TONES } from '../stats/metricTones';

export function ReleaseSmartLinkStats({ releaseId }: { releaseId: string }) {
  const [stats, setStats] = useState<ReleaseSmartLinkAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchReleaseSmartLinkAnalytics(releaseId).then((result) => {
      if (!cancelled) {
        setStats(result.data);
        setError(
          result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [releaseId, attempt]);

  if (error) {
    return (
      <StudioPanel title="Smart link stats">
        <PageError
          title="Couldn't load smart link stats"
          description={error}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </StudioPanel>
    );
  }

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
          tone={STUDIO_METRIC_TONES.smartLinkViews}
          icon={<EyeIcon size={16} />}
        />
        <StatTile
          label="Clicks"
          value={stats.totalClicks.toLocaleString()}
          tone={STUDIO_METRIC_TONES.smartLinkClicks}
          icon={<ExternalLinkIcon size={16} />}
        />
        <StatTile
          label="Click-through"
          value={clickRate === null ? '—' : `${clickRate}%`}
          tone={STUDIO_METRIC_TONES.clickThrough}
          icon={<PercentIcon size={16} />}
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
