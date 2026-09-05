import { useEffect, useState } from 'react';

import { Badge, ViewShell } from '@tahti-player/ui';

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

export function AdminStatusView() {
  const [data, setData] = useState<AdminStatusData | null>(null);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [platform, setPlatform] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      fetchAdminStatus(),
      fetchAdminDashboard(),
      fetchPlatformStatus(),
    ]).then(([status, adminDashboard, platformStatus]) => {
      setData(status.data);
      setDashboard(adminDashboard.data);
      setPlatform(platformStatus.data);
      setLoading(false);
    });
  }, []);

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
          <ViewShell title="Status" classes={{ root: 'px-0 pt-0' }}>
            <StudioPanel>
              {loading ? (
                <PageLoading label="Loading service status…" />
              ) : !data ? (
                <PageError description="Could not load status." />
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
                      <time
                        dateTime={platform?.ts ?? data.ts}
                        title={new Date(
                          platform?.ts ?? data.ts,
                        ).toLocaleString()}
                      >
                        {humanizePastDate(platform?.ts ?? data.ts)}
                      </time>
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
                <StudioPanel title="Queue health">
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
                <StudioPanel title="Cron jobs">
                  <ul className="divide-border divide-y">
                    {dashboard.cronJobs.map((job) => (
                      <li
                        key={job.jobName}
                        className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                      >
                        <span title={job.description}>{job.jobName}</span>
                        <span className="text-foreground-secondary text-xs">
                          {job.lastRun ? (
                            <>
                              {job.lastRun.outcome ?? '—'}
                              {' · '}
                              <time
                                dateTime={job.lastRun.startedAt}
                                title={new Date(
                                  job.lastRun.startedAt,
                                ).toLocaleString()}
                              >
                                {humanizePastDate(job.lastRun.startedAt)}
                              </time>
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
          </ViewShell>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
