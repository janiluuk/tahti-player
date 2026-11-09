import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  fetchAdminDashboard,
  fetchAdminStatus,
  type AdminDashboard,
  type AdminStatusData,
} from '../../api/admin';
import { fetchPlatformStatus } from '../../api/client';
import type { PlatformStatus } from '../../api/types';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { humanizePastDate } from '../../lib/humanizeDate';
import { useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { CronHistoryDialog } from './status/CronHistoryDialog';
import { WorkersPanel } from './status/WorkersPanel';

export function AdminStatusView() {
  const { t } = useTranslation('web');
  const snapshot = useSnapshotFetch<{
    data: AdminStatusData | null;
    dashboard: AdminDashboard | null;
    platform: PlatformStatus | null;
  }>('admin-status', async () => {
    const [status, adminDashboard, platformStatus] = await Promise.all([
      fetchAdminStatus(),
      fetchAdminDashboard(),
      fetchPlatformStatus(),
    ]);
    return {
      data: status.data,
      dashboard: adminDashboard.data,
      platform: platformStatus.data,
    };
  });
  const data = snapshot.data?.data ?? null;
  const dashboard = snapshot.data?.dashboard ?? null;
  const platform = snapshot.data?.platform ?? null;
  const { loading } = snapshot;
  const [cronJob, setCronJob] = useState<string | null>(null);

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
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/status">
          <div className="flex flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminStatusView.admin')}
              </BreadcrumbLink>
              <BreadcrumbCurrent>
                {t('adminStatusView.status')}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={t('adminStatusView.status')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <StudioPanel>
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
                          overallStatus === 'operational' ||
                          overallStatus === 'ok'
                            ? 'green'
                            : 'orange'
                        }
                      >
                        {overallStatus}
                      </Badge>
                      <span className="text-foreground-secondary text-xs">
                        {platform?.version
                          ? `Version ${platform.version} · `
                          : ''}
                        Uptime{' '}
                        {Math.floor(
                          (platform?.uptimeSec ?? data.uptimeSec) / 3600,
                        )}
                        h{' · checked '}
                        <Tooltip
                          content={new Date(
                            platform?.ts ?? data.ts,
                          ).toLocaleString()}
                          side="top"
                          wrapperClassName="inline"
                        >
                          <time
                            dateTime={platform?.ts ?? data.ts}
                            aria-description={new Date(
                              platform?.ts ?? data.ts,
                            ).toLocaleString()}
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
                            {check.detail && (
                              <div className="text-foreground-secondary text-xs">
                                {check.detail}
                              </div>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {check.latencyMs != null && (
                              <span className="text-foreground-secondary text-xs">
                                {check.latencyMs} ms
                              </span>
                            )}
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
              {dashboard && (
                <div className="grid gap-6 md:grid-cols-2">
                  <StudioPanel title={t('adminStatusView.queueHealth')}>
                    <ul className="divide-border divide-y">
                      {dashboard.queues.map((queue) => (
                        <li
                          key={queue.name}
                          className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                        >
                          <span>{queue.name}</span>
                          <span className="text-foreground-secondary text-xs">
                            {queue.waiting} waiting
                            {queue.failed > 0 ? `, ${queue.failed} failed` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </StudioPanel>
                  <StudioPanel title={t('adminStatusView.cronJobs')}>
                    <ul className="divide-border divide-y">
                      {dashboard.cronJobs.map((job) => (
                        <li
                          key={job.jobName}
                          className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                        >
                          <Tooltip
                            content={job.description}
                            side="right"
                            wrapperClassName="inline-flex"
                            multiline
                          >
                            <Button
                              aria-description={job.description}
                              size="flexible"
                              variant="text"
                              className="p-0 text-sm underline-offset-2 hover:underline"
                              aria-label={`${job.jobName} run history`}
                              onClick={() => setCronJob(job.jobName)}
                            >
                              {job.jobName}
                            </Button>
                          </Tooltip>
                          <span className="text-foreground-secondary text-xs">
                            {job.lastRun ? (
                              <>
                                {job.lastRun.outcome ?? '—'}
                                {' · '}
                                <Tooltip
                                  content={new Date(
                                    job.lastRun.startedAt,
                                  ).toLocaleString()}
                                  side="top"
                                  wrapperClassName="inline"
                                >
                                  <time
                                    dateTime={job.lastRun.startedAt}
                                    aria-description={new Date(
                                      job.lastRun.startedAt,
                                    ).toLocaleString()}
                                  >
                                    {humanizePastDate(job.lastRun.startedAt)}
                                  </time>
                                </Tooltip>
                              </>
                            ) : (
                              '—'
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </StudioPanel>
                </div>
              )}
              <WorkersPanel />
              <CronHistoryDialog
                jobName={cronJob}
                onClose={() => setCronJob(null)}
              />
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
