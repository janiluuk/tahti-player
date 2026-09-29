import { useEffect, useState } from 'react';

import { Badge, StatTile } from '@tahti-player/ui';

import {
  fetchDownloadGateStats,
  type DownloadGateStats,
} from '../../../api/studio-extras/download-gates';
import { PageEmpty } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';

export function DownloadGatesPanel({ active }: { active: boolean }) {
  const [stats, setStats] = useState<DownloadGateStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchDownloadGateStats().then((result) => {
      if (!cancelled) {
        setStats(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) {
    return null;
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
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm" data-testid="download-gates">
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
          </div>
        )}
      </StudioPanel>
    </div>
  );
}
