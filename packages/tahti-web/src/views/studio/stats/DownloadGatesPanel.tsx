import { useEffect, useState } from 'react';

import { Badge, HorizontalScroll, StatTile } from '@tahti-player/ui';

import {
  fetchDownloadGateStats,
  type DownloadGateStats,
} from '../../../api/studio-extras/download-gates';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';

export function DownloadGatesPanel({ active }: { active: boolean }) {
  const [stats, setStats] = useState<DownloadGateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchDownloadGateStats().then((result) => {
      if (!cancelled) {
        setStats(result.data);
        setError(
          result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
        );
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (loading) {
    return active ? (
      <StudioPanel title="Download gates">
        <PageLoading label="Loading download gates…" />
      </StudioPanel>
    ) : null;
  }

  if (!stats) {
    return error && active ? (
      <StudioPanel title="Download gates">
        <PageError
          title="Could not load download gates"
          description={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      </StudioPanel>
    ) : null;
  }

  return (
    <div className={active ? '' : 'hidden'}>
      <StudioPanel
        title="Download gates"
        description="Follow and repost gates on your free downloads over the last 14 days."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Downloads"
            value={stats.totals.countedDownloads.toLocaleString()}
            sublabel="Passed the gate"
          />
          <StatTile
            label="Blocked"
            value={stats.totals.blockedAttempts.toLocaleString()}
            sublabel="Stopped at a gate"
          />
          <StatTile
            label="Reposts"
            value={stats.totals.repostAcks.toLocaleString()}
            sublabel="To unlock a download"
          />
          <StatTile
            label="Followers"
            value={stats.artistFollowerCount.toLocaleString()}
            sublabel="Current audience"
          />
        </div>
        {stats.items.length === 0 ? (
          <PageEmpty
            title="No gated tracks"
            description="Turn on a follow or repost gate in a track's download settings."
          />
        ) : (
          <HorizontalScroll label="Gated downloads" className="mt-4">
            <table
              className="w-full min-w-[32rem] text-sm"
              data-testid="download-gates"
            >
              <thead>
                <tr className="text-foreground-secondary text-left text-xs">
                  <th className="py-2 pr-3 font-semibold">Track</th>
                  <th className="py-2 pr-3 font-semibold">Gate</th>
                  <th className="py-2 pr-3 text-right font-semibold">
                    Downloads
                  </th>
                  <th className="py-2 pr-3 text-right font-semibold">
                    Blocked
                  </th>
                  <th className="py-2 text-right font-semibold">Reposts</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {stats.items.map((item) => (
                  <tr key={item.soundId}>
                    <td className="py-2 pr-3 font-semibold">{item.title}</td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {item.followToDownload && (
                          <Badge variant="pill" color="blue">
                            Follow
                          </Badge>
                        )}
                        {item.repostToDownload && (
                          <Badge variant="pill" color="purple">
                            Repost
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {item.countedDownloadCount}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {item.blockedDownloadAttempts}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {item.repostAckCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </HorizontalScroll>
        )}
      </StudioPanel>
    </div>
  );
}
