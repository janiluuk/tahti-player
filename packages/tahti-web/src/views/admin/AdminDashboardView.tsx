import { useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Alert,
  Badge,
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  ButtonLink,
  Dialog,
  InlineError,
  InlineLoader,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { fetchAdminDashboard, type AdminDashboard } from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { StatNumber } from '../../components/tahti/StatNumber';
import { humanizePastDate } from '../../lib/humanizeDate';
import { dateLocaleTag } from '../../lib/locale';
import { useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { CommunityStatsPanel } from './dashboard/CommunityStatsPanel';
import { MonitoringEmbedPanel } from './dashboard/MonitoringEmbedPanel';
import { StatusChecksPanel } from './dashboard/StatusChecksPanel';
import { CronHistoryDialog } from './status/CronHistoryDialog';
import { cronOutcomeColor, cronOutcomeLabel } from './status/cronOutcome';
import { QueuesJobsPanel } from './status/QueuesJobsPanel';
import { WorkersPanel } from './status/WorkersPanel';

function euros(cents: number): string {
  return `€${(cents / 100).toLocaleString('fi-FI', { minimumFractionDigits: 0 })}`;
}

function formatDuration(sec: number): string {
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function healthChip(
  ok: boolean,
  labels: { ok: string; down: string },
): { label: string; color: 'green' | 'orange' } {
  return ok
    ? { label: labels.ok, color: 'green' }
    : { label: labels.down, color: 'orange' };
}

function useScrollToHash(hash: string) {
  useEffect(() => {
    if (!hash) {
      return;
    }
    const id = hash.replace(/^#/, '');
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView?.({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);
}

export function AdminDashboardView() {
  const { t } = useTranslation('web');
  const hash = useLocation({ select: (location) => location.hash });
  useScrollToHash(hash);
  const { data, error, loading, refreshing, retry } =
    useSnapshotFetch<AdminDashboard>('admin-dashboard', async () => {
      const res = await fetchAdminDashboard();
      const reason = res.meta.source === 'api' ? res.meta.reason : undefined;
      if (reason) {
        throw new Error(reason);
      }
      return res.data;
    });
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    AdminDashboard['actionRows'][number] | null
  >(null);
  const [cronJob, setCronJob] = useState<string | null>(null);

  const healthRows = data
    ? ([
        [t('adminDashboard.healthIcecast'), data.health.icecast === 'up'],
        [t('adminDashboard.healthMinio'), data.health.minio === 'up'],
        [
          t('adminDashboard.healthPostgresBackup'),
          data.health.postgresBackupAgeHours != null &&
            data.health.postgresBackupAgeHours <= 26,
        ],
        [
          t('adminDashboard.healthFanSubPayouts'),
          data.health.failedFanSubPayouts === 0,
        ],
      ] as const)
    : [];

  const kpiRows = data
    ? ([
        [
          t('adminDashboard.kpiActiveMembers'),
          data.kpis.activeMembers,
          null as string | null,
        ],
        [t('adminDashboard.kpiLiveNow'), data.kpis.liveNow, null],
        [t('adminDashboard.kpiBetaQueue'), data.kpis.betaQueue, null],
        [
          t('adminDashboard.kpiOpenTickets'),
          data.kpis.openTickets,
          data.kpis.ticketsAwaitingReply
            ? t('adminDashboard.ticketsNeedReply', {
                count:
                  data.kpis.ticketsAwaitingReply.toLocaleString(
                    dateLocaleTag(),
                  ),
              })
            : null,
        ],
      ] as const)
    : [];

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin">
          <div className="flex flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminDashboard.admin')}
              </BreadcrumbLink>
              <BreadcrumbCurrent>
                {t('adminDashboard.dashboard')}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={t('adminDashboard.dashboard')}
              actions={
                refreshing ? (
                  <span data-testid="admin-dashboard-refreshing">
                    <InlineLoader
                      textSize="xs"
                      label={t('adminDashboard.updating')}
                    />
                  </span>
                ) : error && data ? (
                  <span className="text-accent-red-strong text-xs">
                    {t('adminDashboard.showingSaved')}
                  </span>
                ) : null
              }
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <CommunityStatsPanel />
              {loading ? (
                <StudioPanel>
                  <PageLoading label={t('loading.loadingDashboard')} />
                </StudioPanel>
              ) : !data ? (
                <StudioPanel>
                  <PageError
                    title={t('loadErrors.couldnTLoadTheDashboard')}
                    description={error ?? undefined}
                    onRetry={retry}
                  />
                </StudioPanel>
              ) : (
                <>
                  <StudioPanel title={t('adminDashboard.systemHealth')}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {healthRows.map(([label, ok]) => {
                        const chip = healthChip(ok, {
                          ok: t('adminDashboard.ok'),
                          down: t('adminDashboard.down'),
                        });
                        return (
                          <div
                            key={label}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{label}</span>
                            <Badge variant="pill" color={chip.color}>
                              {chip.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ButtonLink
                        to="/admin"
                        hash="status-checks"
                        size="sm"
                        variant="text"
                      >
                        {t('adminDashboard.statusChecks')}
                      </ButtonLink>
                      <ButtonLink
                        to="/admin"
                        hash="monitoring"
                        size="sm"
                        variant="text"
                      >
                        {t('adminDashboard.monitoring')}
                      </ButtonLink>
                      <ButtonLink to="/admin/logs" size="sm" variant="text">
                        {t('adminDashboard.viewLogs')}
                      </ButtonLink>
                    </div>
                  </StudioPanel>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {kpiRows.map(([label, value, note]) => (
                      <StudioPanel key={label} className="!p-4 sm:!p-5">
                        <div className="text-foreground-secondary text-xs tracking-wide uppercase">
                          {label}
                        </div>
                        <StatNumber className="mt-2 block text-3xl">
                          {value.toLocaleString(dateLocaleTag())}
                        </StatNumber>
                        {note ? (
                          <InlineError
                            textSize="xs"
                            className="mt-1 font-semibold"
                            announce={false}
                          >
                            {note}
                          </InlineError>
                        ) : null}
                      </StudioPanel>
                    ))}
                  </div>

                  <StudioPanel title={t('adminDashboard.needsAction')}>
                    {data.actionRows.length === 0 ? (
                      <PageEmpty title={t('empties.nothingNeedsAction')} />
                    ) : (
                      <ul className="divide-border divide-y">
                        {data.actionRows.map((row) => (
                          <li
                            key={row.id}
                            className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                          >
                            <div className="min-w-0 flex-1 basis-48">
                              <div className="font-medium">{row.title}</div>
                              <div className="text-foreground-secondary text-xs">
                                {row.meta}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <ButtonLink
                                to={row.href}
                                size="sm"
                                variant={
                                  row.actionTone === 'amber'
                                    ? 'secondary'
                                    : 'default'
                                }
                              >
                                {row.actionLabel}
                              </ButtonLink>
                              <Button
                                size="sm"
                                variant="text"
                                onClick={() => setSelectedAction(row)}
                              >
                                {t('adminDashboard.viewDetails')}
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </StudioPanel>

                  <Dialog.Root
                    isOpen={selectedAction !== null}
                    onClose={() => setSelectedAction(null)}
                    className="max-w-lg"
                  >
                    {selectedAction ? (
                      <>
                        <Dialog.Title>{selectedAction.title}</Dialog.Title>
                        <Dialog.Description>
                          {selectedAction.meta}
                        </Dialog.Description>
                        <Alert tone="neutral" className="mt-4">
                          {t('adminDashboard.actionWaitingDetail', {
                            action: selectedAction.actionLabel,
                          })}
                        </Alert>
                        <Dialog.Actions>
                          <Dialog.Close>
                            {t('adminDashboard.close')}
                          </Dialog.Close>
                          <ButtonLink to={selectedAction.href}>
                            {selectedAction.actionLabel}
                          </ButtonLink>
                        </Dialog.Actions>
                      </>
                    ) : null}
                  </Dialog.Root>

                  <StatusChecksPanel />

                  <div className="grid gap-6 md:grid-cols-2">
                    <StudioPanel title={t('adminDashboard.queueHealth')}>
                      <ul className="divide-border divide-y">
                        {data.queues.map((queue) => (
                          <li
                            key={queue.name}
                            className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                          >
                            <span>{queue.name}</span>
                            <span className="text-foreground-secondary text-xs">
                              {t('adminDashboard.queueWaiting', {
                                waiting: queue.waiting,
                              })}
                              {queue.failed > 0
                                ? t('adminDashboard.queueFailed', {
                                    failed: queue.failed,
                                  })
                                : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </StudioPanel>
                    <StudioPanel title={t('adminDashboard.cronJobs')}>
                      <ul className="divide-border divide-y">
                        {data.cronJobs.map((job) => (
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
                                aria-label={t('cronOutcome.runHistory', {
                                  job: job.jobName,
                                })}
                                onClick={() => setCronJob(job.jobName)}
                              >
                                {job.jobName}
                              </Button>
                            </Tooltip>
                            <span className="text-foreground-secondary text-xs">
                              {job.lastRun ? (
                                <>
                                  <Badge
                                    variant="pill"
                                    color={cronOutcomeColor(
                                      job.lastRun.outcome,
                                    )}
                                    className="mr-1.5 align-middle"
                                  >
                                    {cronOutcomeLabel(job.lastRun.outcome)}
                                  </Badge>
                                  <Tooltip
                                    content={new Date(
                                      job.lastRun.startedAt,
                                    ).toLocaleString(dateLocaleTag())}
                                    side="top"
                                    wrapperClassName="inline"
                                  >
                                    <time
                                      dateTime={job.lastRun.startedAt}
                                      aria-description={new Date(
                                        job.lastRun.startedAt,
                                      ).toLocaleString(dateLocaleTag())}
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

                  <div id="queues" className="scroll-mt-20">
                    <QueuesJobsPanel />
                  </div>
                  <div id="workers" className="scroll-mt-20">
                    <WorkersPanel />
                  </div>

                  <MonitoringEmbedPanel />

                  <div>
                    <Button
                      type="button"
                      variant="text"
                      className="text-foreground-secondary hover:text-foreground text-xs tracking-wide uppercase"
                      onClick={() => setMoreOpen((v) => !v)}
                    >
                      {moreOpen
                        ? t('adminDashboardViewStates.hideMore')
                        : t('adminDashboardViewStates.financeStreamsAudit')}
                    </Button>
                  </div>

                  {moreOpen ? (
                    <>
                      <StudioPanel title={t('adminDashboard.financeYtd')}>
                        <StatNumber className="block text-3xl">
                          {euros(data.financeYtdCents.surplus)}
                        </StatNumber>
                        <p className="text-foreground-secondary mt-1 text-sm">
                          {t('adminDashboard.financeBreakdown', {
                            revenue: euros(data.financeYtdCents.revenue),
                            costs: euros(data.financeYtdCents.costs),
                          })}
                        </p>
                      </StudioPanel>

                      {data.liveStreams.length > 0 ? (
                        <StudioPanel
                          title={t('adminDashboardViewLabels.liveNowLength', {
                            length: data.liveStreams.length,
                          })}
                        >
                          <ul className="divide-border divide-y">
                            {data.liveStreams.map((stream) => (
                              <li
                                key={stream.slug}
                                className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                              >
                                <span>{stream.artistName}</span>
                                <span className="text-foreground-secondary text-xs">
                                  {formatDuration(stream.elapsedSec)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </StudioPanel>
                      ) : null}

                      <StudioPanel
                        title={t('adminDashboard.recentAuditEvents')}
                      >
                        <ul className="divide-border divide-y">
                          {data.audit.map((row) => (
                            <li
                              key={row.id}
                              className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                            >
                              <span>{row.action}</span>
                              <span className="text-foreground-secondary text-xs">
                                {new Date(row.createdAt).toLocaleString(
                                  dateLocaleTag(),
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </StudioPanel>
                    </>
                  ) : null}

                  <CronHistoryDialog
                    jobName={cronJob}
                    onClose={() => setCronJob(null)}
                  />
                </>
              )}
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
