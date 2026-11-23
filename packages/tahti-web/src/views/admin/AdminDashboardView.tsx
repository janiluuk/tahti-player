import { useLocation, useNavigate } from '@tanstack/react-router';
import {
  ActivityIcon,
  GaugeIcon,
  HeartPulseIcon,
  HistoryIcon,
  ListChecksIcon,
  ServerCogIcon,
} from 'lucide-react';
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
  InlineLoader,
  StatTile,
  Tabs,
  ViewShell,
} from '@tahti-player/ui';

import { fetchAdminDashboard, type AdminDashboard } from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { dateLocaleTag } from '../../lib/locale';
import { useSnapshotFetch } from '../../lib/useSnapshotFetch';
import {
  ADMIN_DASHBOARD_TABS,
  adminDashboardTabForHash,
  type AdminDashboardTab,
} from './dashboard/adminDashboardTabs';
import { CronJobsTable } from './dashboard/CronJobsTable';
import { LiveNowStrip } from './dashboard/LiveNowStrip';
import { MonitoringEmbedPanel } from './dashboard/MonitoringEmbedPanel';
import { QueueHealthStrip } from './dashboard/QueueHealthStrip';
import { StatusChecksPanel } from './dashboard/StatusChecksPanel';
import { CronHistoryDialog } from './status/CronHistoryDialog';
import { QueuesJobsPanel } from './status/QueuesJobsPanel';
import { WorkersPanel } from './status/WorkersPanel';

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

function HealthTab({ data }: { data: AdminDashboard }) {
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
      <StudioPanel
        title={t('adminDashboard.systemHealth')}
        icon={HeartPulseIcon}
        compact
      >
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
          {healthRows.map(([label, ok]) => {
            const chip = healthChip(ok, {
              ok: t('adminDashboard.ok'),
              down: t('adminDashboard.down'),
            });
            return (
              <div
                key={label}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate">{label}</span>
                <Badge variant="pill" color={chip.color}>
                  {chip.label}
                </Badge>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <ButtonLink
            to="/admin"
            search={{}}
            hash="status-checks"
            size="sm"
            variant="text"
          >
            {t('adminDashboard.statusChecks')}
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiRows.map(([label, value, note]) => (
          <StatTile
            key={label}
            label={label}
            value={value.toLocaleString(dateLocaleTag())}
            sublabel={
              note ? (
                <span className="text-accent-red-strong font-semibold">
                  {note}
                </span>
              ) : undefined
            }
          />
        ))}
      </div>

      <LiveNowStrip streams={data.liveStreams} />

      <StatusChecksPanel />
    </div>
  );
}

function JobsTab({
  data,
  onOpenCron,
}: {
  data: AdminDashboard;
  onOpenCron: (job: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <QueueHealthStrip queues={data.queues} />
      <CronJobsTable jobs={data.cronJobs} onOpen={onOpenCron} />
      <div id="queues" className="scroll-mt-20">
        <QueuesJobsPanel />
      </div>
      <div id="workers" className="scroll-mt-20">
        <WorkersPanel />
      </div>
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
      <StudioPanel
        id="needs-action"
        title={t('adminDashboard.needsAction')}
        icon={ListChecksIcon}
        compact
        className="scroll-mt-20"
      >
        {data.actionRows.length === 0 ? (
          <PageEmpty title={t('empties.nothingNeedsAction')} />
        ) : (
          <ul className="divide-border divide-y">
            {data.actionRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0"
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

      <StudioPanel
        title={t('adminDashboard.recentAuditEvents')}
        icon={HistoryIcon}
        compact
      >
        <ul className="divide-border divide-y">
          {data.audit.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-2 py-1.5 text-sm first:pt-0 last:pb-0"
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

/** On a phone only the selected tab keeps its visible label, so the four
 * tabs stay on one row; the others keep theirs for screen readers. */
function tabLabel(text: string, selected: boolean) {
  return (
    <span className={selected ? undefined : 'max-sm:sr-only'}>{text}</span>
  );
}

function jobsProblemCount(data: AdminDashboard): number {
  return (
    data.queues.filter((queue) => queue.failed > 0).length +
    data.cronJobs.filter(
      (job) =>
        job.lastRun?.outcome != null && job.lastRun.outcome !== 'SUCCESS',
    ).length
  );
}

export function AdminDashboardView({ tab }: { tab?: AdminDashboardTab }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const hash = useLocation({ select: (location) => location.hash });
  useScrollToHash(hash);
  const activeTab = tab ?? adminDashboardTabForHash(hash) ?? 'health';
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
  const selectedIndex = Math.max(0, ADMIN_DASHBOARD_TABS.indexOf(activeTab));

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
                    listClassName="flex-nowrap overflow-x-auto"
                    panelClassName="pt-4"
                    items={[
                      {
                        id: 'health',
                        label: tabLabel(
                          t('adminDashboard.tabHealth'),
                          activeTab === 'health',
                        ),
                        icon: <HeartPulseIcon size={14} />,
                        content: <HealthTab data={data} />,
                      },
                      {
                        id: 'jobs',
                        label: tabLabel(
                          t('adminDashboard.tabJobs'),
                          activeTab === 'jobs',
                        ),
                        icon: <ServerCogIcon size={14} />,
                        count: jobsProblemCount(data) || undefined,
                        content: (
                          <JobsTab data={data} onOpenCron={setCronJob} />
                        ),
                      },
                      {
                        id: 'monitoring',
                        label: tabLabel(
                          t('adminDashboard.tabMonitoring'),
                          activeTab === 'monitoring',
                        ),
                        icon: <GaugeIcon size={14} />,
                        content: <MonitoringEmbedPanel />,
                      },
                      {
                        id: 'activity',
                        label: tabLabel(
                          t('adminDashboard.tabActivity'),
                          activeTab === 'activity',
                        ),
                        icon: <ActivityIcon size={14} />,
                        count: data.actionRows.length || undefined,
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
