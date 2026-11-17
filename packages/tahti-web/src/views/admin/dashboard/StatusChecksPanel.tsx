import { useTranslation } from '@tahti-player/i18n';
import { Badge, Tooltip } from '@tahti-player/ui';

import { fetchAdminStatus, type AdminStatusData } from '../../../api/admin';
import { fetchPlatformStatus } from '../../../api/client';
import type { PlatformStatus } from '../../../api/types';
import { PageError, PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { humanizePastDate } from '../../../lib/humanizeDate';
import { dateLocaleTag } from '../../../lib/locale';
import { useSnapshotFetch } from '../../../lib/useSnapshotFetch';

export function StatusChecksPanel() {
  const { t } = useTranslation('web');
  const snapshot = useSnapshotFetch<{
    data: AdminStatusData | null;
    platform: PlatformStatus | null;
  }>('admin-status-checks', async () => {
    const [status, platformStatus] = await Promise.all([
      fetchAdminStatus(),
      fetchPlatformStatus(),
    ]);
    return {
      data: status.data,
      platform: platformStatus.data,
    };
  });
  const data = snapshot.data?.data ?? null;
  const platform = snapshot.data?.platform ?? null;
  const { loading } = snapshot;

  const mergedChecks = data
    ? Object.entries(platform?.checks ?? {}).reduce(
        (checks, [id, check]) => {
          if (!checks[id]) {
            checks[id] = {
              state: check.state === 'ok' ? 'up' : 'down',
              critical: Boolean(check.critical),
              latencyMs: check.latencyMs,
              detail: check.detail,
            };
          }
          return checks;
        },
        { ...data.checks },
      )
    : {};
  const overallStatus = platform?.status ?? data?.status ?? 'unknown';

  return (
    <StudioPanel
      id="status-checks"
      title={t('adminDashboard.statusChecks')}
      className="scroll-mt-20"
    >
      {loading ? (
        <PageLoading label={t('loading.loadingServiceStatus')} />
      ) : !data ? (
        <PageError description={t('loadErrors.couldNotLoadStatus')} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <Badge
              variant="pill"
              color={
                overallStatus === 'operational' || overallStatus === 'ok'
                  ? 'green'
                  : 'orange'
              }
            >
              {overallStatus}
            </Badge>
            <span className="text-foreground-secondary text-xs">
              {platform?.version
                ? t('adminDashboard.versionLine', {
                    version: platform.version,
                  })
                : ''}
              {t('adminDashboard.uptimeHours', {
                hours: Math.floor(
                  (platform?.uptimeSec ?? data.uptimeSec) / 3600,
                ),
              })}
              {' · '}
              {t('adminDashboard.checked')}{' '}
              <Tooltip
                content={new Date(platform?.ts ?? data.ts).toLocaleString(
                  dateLocaleTag(),
                )}
                side="top"
                wrapperClassName="inline"
              >
                <time
                  dateTime={platform?.ts ?? data.ts}
                  aria-description={new Date(
                    platform?.ts ?? data.ts,
                  ).toLocaleString(dateLocaleTag())}
                >
                  {humanizePastDate(platform?.ts ?? data.ts)}
                </time>
              </Tooltip>
            </span>
          </div>
          <ul className="divide-border divide-y">
            {Object.entries(mergedChecks).map(([id, check]) => (
              <li
                key={id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{id}</div>
                  {check.detail ? (
                    <div className="text-foreground-secondary text-xs">
                      {check.detail}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {check.latencyMs != null ? (
                    <span className="text-foreground-secondary text-xs">
                      {t('adminDashboard.latencyMs', { ms: check.latencyMs })}
                    </span>
                  ) : null}
                  <Badge
                    variant="pill"
                    color={check.state === 'up' ? 'green' : 'orange'}
                  >
                    {check.state}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </StudioPanel>
  );
}
