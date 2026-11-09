import { BanIcon, DownloadIcon, Repeat2Icon, UsersIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
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
import { apiResult, useSnapshotFetch } from '../../../lib/useSnapshotFetch';
import { STUDIO_METRIC_TONES } from './metricTones';

export function DownloadGatesPanel({ active }: { active: boolean }) {
  const { t } = useTranslation('web');
  const {
    data: stats,
    loading,
    error,
    retry,
  } = useSnapshotFetch<DownloadGateStats>('download-gate-stats', async () => {
    const stats = apiResult(await fetchDownloadGateStats());
    if (!stats) {
      throw new Error('No download gate stats');
    }
    return stats;
  });

  if (loading) {
    return active ? (
      <StudioPanel title={t('downloadGates.downloadGates')}>
        <PageLoading label={t('loading.loadingDownloadGates')} />
      </StudioPanel>
    ) : null;
  }

  if (!stats) {
    return error && active ? (
      <StudioPanel title={t('downloadGates.downloadGates')}>
        <PageError
          title={t('loadErrors.couldNotLoadDownloadGates')}
          description={error}
          onRetry={retry}
        />
      </StudioPanel>
    ) : null;
  }

  return (
    <div className={active ? '' : 'hidden'}>
      <StudioPanel
        title={t('downloadGates.downloadGates')}
        description={t('downloadGates.followAndRepostGatesOn')}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label={t('downloadGates.downloads')}
            tone={STUDIO_METRIC_TONES.downloads}
            icon={<DownloadIcon size={16} />}
            value={stats.totals.countedDownloads.toLocaleString()}
            sublabel={t('downloadGates.passedTheGate')}
          />
          <StatTile
            label={t('downloadGates.blocked')}
            tone={STUDIO_METRIC_TONES.gateBlocked}
            icon={<BanIcon size={16} />}
            value={stats.totals.blockedAttempts.toLocaleString()}
            sublabel={t('downloadGates.stoppedAtAGate')}
          />
          <StatTile
            label={t('downloadGates.reposts')}
            tone={STUDIO_METRIC_TONES.reposts}
            icon={<Repeat2Icon size={16} />}
            value={stats.totals.repostAcks.toLocaleString()}
            sublabel={t('downloadGates.toUnlockADownload')}
          />
          <StatTile
            label={t('downloadGates.followers')}
            tone={STUDIO_METRIC_TONES.followers}
            icon={<UsersIcon size={16} />}
            value={stats.artistFollowerCount.toLocaleString()}
            sublabel={t('downloadGates.currentAudience')}
          />
        </div>
        {stats.items.length === 0 ? (
          <PageEmpty
            title={t('empties.noGatedTracks')}
            description={t('empties.turnOnAFollowOrRepost')}
          />
        ) : (
          <HorizontalScroll
            label={t('downloadGates.gatedDownloads')}
            className="mt-4"
          >
            <DataTable className="min-w-[32rem]" data-testid="download-gates">
              <DataTableHead>
                <DataTableRow>
                  <DataTableHeaderCell>
                    {t('downloadGates.track')}
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    {t('downloadGates.gate')}
                  </DataTableHeaderCell>
                  <DataTableHeaderCell className="text-right">
                    {t('downloadGates.downloads')}
                  </DataTableHeaderCell>
                  <DataTableHeaderCell className="text-right">
                    {t('downloadGates.blocked')}
                  </DataTableHeaderCell>
                  <DataTableHeaderCell className="text-right">
                    {t('downloadGates.reposts')}
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
                            {t('downloadGates.follow')}
                          </Badge>
                        )}
                        {item.repostToDownload && (
                          <Badge variant="pill" color="purple">
                            {t('downloadGates.repost')}
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
