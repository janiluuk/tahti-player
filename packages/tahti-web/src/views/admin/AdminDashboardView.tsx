import { Link } from '@tanstack/react-router';
import { ExternalLinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Alert,
  Badge,
  Button,
  ButtonAnchor,
  ButtonLink,
  Dialog,
  ViewShell,
} from '@tahti-player/ui';

import { fetchAdminDashboard, type AdminDashboard } from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { StatNumber } from '../../components/tahti/StatNumber';
import {
  GRAFANA_DASHBOARDS,
  grafanaDashboardUrl,
  grafanaExploreLogsUrl,
  MONITORING_SERVICES,
} from '../../lib/grafanaMonitoring';
import { CommunityStatsPanel } from './dashboard/CommunityStatsPanel';

function euros(cents: number): string {
  return `€${(cents / 100).toLocaleString('fi-FI', { minimumFractionDigits: 0 })}`;
}

function formatDuration(sec: number): string {
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function healthChip(ok: boolean): { label: string; color: 'green' | 'orange' } {
  return ok
    ? { label: 'OK', color: 'green' }
    : { label: 'Down', color: 'orange' };
}

export function AdminDashboardView() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<
    AdminDashboard['actionRows'][number] | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchAdminDashboard().then((res) => {
      if (cancelled) {
        return;
      }
      const reason = res.meta.source === 'api' ? res.meta.reason : undefined;
      // The failure payload is zeroed KPIs and "down" health; never show it.
      setData(reason ? null : res.data);
      setError(reason ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin">
          <div className="flex flex-col gap-6">
            <nav
              aria-label="Breadcrumb"
              className="text-foreground-secondary flex flex-wrap items-center gap-1 text-xs"
            >
              <Link to="/admin" className="hover:underline">
                Admin
              </Link>
              <span aria-hidden>→</span>
              <span aria-current="page">Dashboard</span>
            </nav>
            <ViewShell
              title="Dashboard"
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              {loading ? (
                <StudioPanel>
                  <PageLoading label="Loading dashboard…" />
                </StudioPanel>
              ) : !data ? (
                <StudioPanel>
                  <PageError
                    title="Couldn't load the dashboard"
                    description={error ?? undefined}
                    onRetry={() => setAttempt((n) => n + 1)}
                  />
                </StudioPanel>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {(
                      [
                        ['Active members', data.kpis.activeMembers, null],
                        ['Live now', data.kpis.liveNow, null],
                        ['Beta queue', data.kpis.betaQueue, null],
                        [
                          'Open tickets',
                          data.kpis.openTickets,
                          data.kpis.ticketsAwaitingReply
                            ? `${data.kpis.ticketsAwaitingReply.toLocaleString()} need a reply`
                            : null,
                        ],
                      ] as const
                    ).map(([label, value, note]) => (
                      <StudioPanel key={label} className="!p-4 sm:!p-5">
                        <div className="text-foreground-secondary text-xs tracking-wide uppercase">
                          {label}
                        </div>
                        <StatNumber className="mt-2 block text-3xl">
                          {value.toLocaleString()}
                        </StatNumber>
                        {note ? (
                          <p className="text-accent-red-strong mt-1 text-xs font-semibold">
                            {note}
                          </p>
                        ) : null}
                      </StudioPanel>
                    ))}
                  </div>

                  <StudioPanel title="Needs action">
                    {data.actionRows.length === 0 ? (
                      <PageEmpty title="Nothing needs action right now." />
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
                                View details
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
                          This item is waiting for an admin action. Open its
                          queue to inspect the full record before completing “
                          {selectedAction.actionLabel}”.
                        </Alert>
                        <Dialog.Actions>
                          <Dialog.Close>Close</Dialog.Close>
                          <ButtonLink to={selectedAction.href}>
                            {selectedAction.actionLabel}
                          </ButtonLink>
                        </Dialog.Actions>
                      </>
                    ) : null}
                  </Dialog.Root>

                  <StudioPanel title="System health">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          [
                            'Icecast / Liquidsoap',
                            data.health.icecast === 'up',
                          ],
                          ['MinIO storage', data.health.minio === 'up'],
                          [
                            'Postgres backup',
                            data.health.postgresBackupAgeHours != null &&
                              data.health.postgresBackupAgeHours <= 26,
                          ],
                          [
                            'Fan-sub payouts',
                            data.health.failedFanSubPayouts === 0,
                          ],
                        ] as const
                      ).map(([label, ok]) => {
                        const chip = healthChip(ok);
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
                  </StudioPanel>

                  <StudioPanel title="Monitoring">
                    <p className="text-foreground-secondary mb-3 text-sm">
                      Grafana vitals, infrastructure, and container logs for the
                      production stack.
                    </p>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <ButtonLink
                        to="/admin/monitoring"
                        size="sm"
                        variant="secondary"
                      >
                        Operations hub
                      </ButtonLink>
                      <ButtonLink
                        to="/admin/logs"
                        search={{ tab: 'containers' }}
                        size="sm"
                        variant="text"
                      >
                        Container logs
                      </ButtonLink>
                      {(
                        Object.values(GRAFANA_DASHBOARDS) as Array<{
                          uid: string;
                          title: string;
                        }>
                      ).map((dash) => (
                        <ButtonAnchor
                          key={dash.uid}
                          href={grafanaDashboardUrl(dash.uid)}
                          target="_blank"
                          rel="noreferrer"
                          size="sm"
                          variant="text"
                        >
                          {dash.title}
                          <ExternalLinkIcon
                            size={12}
                            aria-hidden
                            className="ml-1"
                          />
                        </ButtonAnchor>
                      ))}
                      <ButtonAnchor
                        href={grafanaExploreLogsUrl()}
                        target="_blank"
                        rel="noreferrer"
                        size="sm"
                        variant="text"
                      >
                        Grafana Loki
                        <ExternalLinkIcon
                          size={12}
                          aria-hidden
                          className="ml-1"
                        />
                      </ButtonAnchor>
                    </div>
                    <ul className="divide-border divide-y">
                      {MONITORING_SERVICES.slice(0, 6).map((svc) => {
                        const dash = GRAFANA_DASHBOARDS[svc.grafana.dashboard];
                        return (
                          <li
                            key={svc.id}
                            className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0"
                          >
                            <span className="font-medium">{svc.label}</span>
                            <div className="flex flex-wrap gap-2">
                              <ButtonAnchor
                                href={grafanaDashboardUrl(dash.uid)}
                                target="_blank"
                                rel="noreferrer"
                                size="sm"
                                variant="text"
                              >
                                Grafana
                              </ButtonAnchor>
                              <ButtonLink
                                to="/admin/logs"
                                search={{
                                  tab: 'containers',
                                  service: svc.logService,
                                }}
                                size="sm"
                                variant="text"
                              >
                                Logs
                              </ButtonLink>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </StudioPanel>

                  <CommunityStatsPanel />

                  <div>
                    <Button
                      type="button"
                      variant="text"
                      className="text-foreground-secondary hover:text-foreground text-xs tracking-wide uppercase"
                      onClick={() => setMoreOpen((v) => !v)}
                    >
                      {moreOpen
                        ? 'Hide more'
                        : 'Finance, streams, queues & audit'}
                    </Button>
                  </div>

                  {moreOpen ? (
                    <>
                      <StudioPanel title="Finance YTD">
                        <StatNumber className="block text-3xl">
                          {euros(data.financeYtdCents.surplus)}
                        </StatNumber>
                        <p className="text-foreground-secondary mt-1 text-sm">
                          Revenue {euros(data.financeYtdCents.revenue)} · Costs{' '}
                          {euros(data.financeYtdCents.costs)}
                        </p>
                      </StudioPanel>

                      {data.liveStreams.length > 0 ? (
                        <StudioPanel
                          title={`Live now (${data.liveStreams.length})`}
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

                      <StudioPanel title="Queue health">
                        <ul className="divide-border divide-y">
                          {data.queues.map((queue) => (
                            <li
                              key={queue.name}
                              className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                            >
                              <span>{queue.name}</span>
                              <span className="text-foreground-secondary text-xs">
                                {queue.waiting} waiting
                                {queue.failed > 0
                                  ? `, ${queue.failed} failed`
                                  : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </StudioPanel>

                      <StudioPanel title="Cron jobs">
                        <ul className="divide-border divide-y">
                          {data.cronJobs.map((job) => (
                            <li
                              key={job.jobName}
                              className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                            >
                              <span title={job.description}>{job.jobName}</span>
                              <span className="text-foreground-secondary text-xs">
                                {job.lastRun?.outcome ?? '—'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </StudioPanel>

                      <StudioPanel title="Recent audit events">
                        <ul className="divide-border divide-y">
                          {data.audit.map((row) => (
                            <li
                              key={row.id}
                              className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                            >
                              <span>{row.action}</span>
                              <span className="text-foreground-secondary text-xs">
                                {new Date(row.createdAt).toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </StudioPanel>
                    </>
                  ) : null}
                </>
              )}
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
