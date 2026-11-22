import { useLocation, useNavigate } from '@tanstack/react-router';
import { ActivityIcon, HeartPulseIcon } from 'lucide-react';
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
  Tabs,
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
import {
  ADMIN_DASHBOARD_TABS,
  type AdminDashboardTab,
} from './dashboard/adminDashboardTabs';
import { MonitoringEmbedPanel } from './dashboard/MonitoringEmbedPanel';
import { StatusChecksPanel } from './dashboard/StatusChecksPanel';
import { CronHistoryDialog } from './status/CronHistoryDialog';
import { cronOutcomeColor, cronOutcomeLabel } from './status/cronOutcome';
import { QueuesJobsPanel } from './status/QueuesJobsPanel';
import { WorkersPanel } from './status/WorkersPanel';

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

function HealthTab({
  data,
  onOpenCron,
}: {
  data: AdminDashboard;
  onOpenCron: (job: string) => void;
}) {
  const { t } = useTranslation('web');
  const healthRows = [
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
  ] as const;

  const kpiRows = [
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
              data.kpis.ticketsAwaitingReply.toLocaleString(dateLocaleTag()),
          })
        : null,
    ],
  ] as const;

  return (
    <div className="flex flex-col gap-4">
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
            search={{}}
            hash="status-checks"
            size="sm"
            variant="text"
          >
            {t('adminDashboard.statusChecks')}
          </ButtonLink>
          <ButtonLink
            to="/admin"
            search={{}}
            hash="monitoring"
            size="sm"
            variant="text"
          >
            {t('adminDashboard.monitoring')}
          </ButtonLink>
          <ButtonLink to="/admin/logs" size="sm" variant="text">
            {t('adminDashboard.viewLogs')}
          </ButtonLink>
          <ButtonLink to="/admin/community" size="sm" variant="text">
            {t('adminCommunityView.community')}
          </ButtonLink>
          <ButtonLink to="/admin/financial" size="sm" variant="text">
            {t('adminDashboard.financeYtd')}
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
                    onClick={() => onOpenCron(job.jobName)}
                  >
                    {job.jobName}
                  </Button>
                </Tooltip>
                <span className="text-foreground-secondary text-xs">
                  {job.lastRun ? (
                    <>
                      <Badge
                        variant="pill"
                        color={cronOutcomeColor(job.lastRun.outcome)}
                        className="mr-1.5 align-middle"
                      >
                        {cronOutcomeLabel(job.lastRun.outcome)}
                      </Badge>
                      <Tooltip
                        content={new Date(job.lastRun.startedAt).toLocaleString(
                          dateLocaleTag(),
                        )}
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
    </div>
  );
}

function ActivityTab({
  data,
  selectedAction,
  onSelectAction,
}: {
  data: AdminDashboard;
  selectedAction: AdminDashboard['actionRows'][number] | null;
  onSelectAction: (row: AdminDashboard['actionRows'][number] | null) => void;
}) {
  const { t } = useTranslation('web');
  return (
    <div className="flex flex-col gap-4">
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
                      row.actionTone === 'amber' ? 'secondary' : 'default'
                    }
                  >
                    {row.actionLabel}
                  </ButtonLink>
                  <Button
                    size="sm"
                    variant="text"
                    onClick={() => onSelectAction(row)}
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
        onClose={() => onSelectAction(null)}
        className="max-w-lg"
      >
        {selectedAction ? (
          <>
            <Dialog.Title>{selectedAction.title}</Dialog.Title>
            <Dialog.Description>{selectedAction.meta}</Dialog.Description>
            <Alert tone="neutral" className="mt-4">
              {t('adminDashboard.actionWaitingDetail', {
                action: selectedAction.actionLabel,
              })}
            </Alert>
            <Dialog.Actions>
              <Dialog.Close>{t('adminDashboard.close')}</Dialog.Close>
              <ButtonLink to={selectedAction.href}>
                {selectedAction.actionLabel}
              </ButtonLink>
            </Dialog.Actions>
          </>
        ) : null}
      </Dialog.Root>

      <StudioPanel title={t('adminDashboard.recentAuditEvents')}>
        <ul className="divide-border divide-y">
          {data.audit.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
            >
              <span>{row.action}</span>
              <span className="text-foreground-secondary text-xs">
                {new Date(row.createdAt).toLocaleString(dateLocaleTag())}
              </span>
            </li>
          ))}
        </ul>
      </StudioPanel>
    </div>
  );
}

export function AdminDashboardView({
  tab = 'health',
}: {
  tab?: AdminDashboardTab;
}) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
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
  const [selectedAction, setSelectedAction] = useState<
    AdminDashboard['actionRows'][number] | null
  >(null);
  const [cronJob, setCronJob] = useState<string | null>(null);
  const selectedIndex = Math.max(0, ADMIN_DASHBOARD_TABS.indexOf(tab));

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
              subtitle={t('adminDashboard.subtitle')}
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
                  <Tabs
                    variant="underline"
                    selectedIndex={selectedIndex}
                    onChange={(index) => {
                      const next = ADMIN_DASHBOARD_TABS[index] ?? 'health';
                      void navigate({
                        to: '/admin',
                        search: next === 'health' ? {} : { tab: next },
                        replace: true,
                      });
                    }}
                    listClassName="flex-wrap"
                    panelClassName="pt-4"
                    items={[
                      {
                        id: 'health',
                        label: t('adminDashboard.tabHealth'),
                        icon: <HeartPulseIcon size={14} />,
                        content: (
                          <HealthTab data={data} onOpenCron={setCronJob} />
                        ),
                      },
                      {
                        id: 'activity',
                        label: t('adminDashboard.tabActivity'),
                        icon: <ActivityIcon size={14} />,
                        content: (
                          <ActivityTab
                            data={data}
                            selectedAction={selectedAction}
                            onSelectAction={setSelectedAction}
                          />
                        ),
                      },
                    ]}
                  />
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
