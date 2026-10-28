import { BanIcon, DownloadIcon, Repeat2Icon, UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Badge,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  HorizontalScroll,
  StatTile,
} from '@tahti-player/ui';

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
import { STUDIO_METRIC_TONES } from './metricTones';

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
            tone={STUDIO_METRIC_TONES.downloads}
            icon={<DownloadIcon size={16} />}
            value={stats.totals.countedDownloads.toLocaleString()}
            sublabel="Passed the gate"
          />
          <StatTile
            label="Blocked"
            tone={STUDIO_METRIC_TONES.gateBlocked}
            icon={<BanIcon size={16} />}
            value={stats.totals.blockedAttempts.toLocaleString()}
            sublabel="Stopped at a gate"
          />
          <StatTile
            label="Reposts"
            tone={STUDIO_METRIC_TONES.reposts}
            icon={<Repeat2Icon size={16} />}
            value={stats.totals.repostAcks.toLocaleString()}
            sublabel="To unlock a download"
          />
          <StatTile
            label="Followers"
            tone={STUDIO_METRIC_TONES.followers}
            icon={<UsersIcon size={16} />}
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
            <DataTable className="min-w-[32rem]" data-testid="download-gates">
              <DataTableHead>
                <DataTableRow>
                  <DataTableHeaderCell>Track</DataTableHeaderCell>
                  <DataTableHeaderCell>Gate</DataTableHeaderCell>
                  <DataTableHeaderCell className="text-right">
                    Downloads
                  </DataTableHeaderCell>
                  <DataTableHeaderCell className="text-right">
                    Blocked
                  </DataTableHeaderCell>
                  <DataTableHeaderCell className="text-right">
                    Reposts
                  </DataTableHeaderCell>
                </DataTableRow>
              </DataTableHead>
              <DataTableBody>
                {stats.items.map((item) => (
                  <DataTableRow key={item.soundId}>
                    <DataTableCell className="font-semibold">
                      {item.title}
                    </DataTableCell>
                    <DataTableCell>
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
                    </DataTableCell>
                    <DataTableCell className="text-right tabular-nums">
                      {item.countedDownloadCount}
                    </DataTableCell>
                    <DataTableCell className="text-right tabular-nums">
                      {item.blockedDownloadAttempts}
                    </DataTableCell>
                    <DataTableCell className="text-right tabular-nums">
                      {item.repostAckCount}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </HorizontalScroll>
        )}
      </StudioPanel>
    </div>
  );
}
