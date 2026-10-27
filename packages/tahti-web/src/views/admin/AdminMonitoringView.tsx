import { ExternalLinkIcon } from 'lucide-react';
import { useState } from 'react';

import {
  Alert,
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  ButtonAnchor,
  ButtonLink,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { StudioPanel } from '../../components/StudioPanel';
import {
  GRAFANA_DASHBOARDS,
  grafanaDashboardEmbedUrl,
  grafanaDashboardUrl,
  grafanaExploreLogsUrl,
  MONITORING_SERVICES,
} from '../../lib/grafanaMonitoring';
import { ContainerLogsPanel } from './monitoring/ContainerLogsPanel';

export function AdminMonitoringView() {
  const [logService, setLogService] = useState<string | undefined>(undefined);
  const vitalUid = GRAFANA_DASHBOARDS.vital.uid;
  const embedSrc = grafanaDashboardEmbedUrl(vitalUid);

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/monitoring">
          <div className="flex flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">Admin</BreadcrumbLink>
              <BreadcrumbCurrent>Monitoring</BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title="Monitoring"
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <Alert tone="neutral">
                Grafana embeds need you signed in at grafana.tahti.live in this
                browser. If the panel is blank, open Grafana in a new tab and
                sign in, then reload this page.
              </Alert>

              <StudioPanel title="Grafana dashboards">
                <div className="flex flex-wrap gap-2">
                  {(
                    Object.values(GRAFANA_DASHBOARDS) as Array<{
                      uid: string;
                      title: string;
                      description: string;
                    }>
                  ).map((dash) => (
                    <Tooltip
                      key={dash.uid}
                      content={dash.description}
                      side="top"
                    >
                      <ButtonAnchor
                        href={grafanaDashboardUrl(dash.uid)}
                        target="_blank"
                        rel="noreferrer"
                        size="sm"
                        variant="secondary"
                        aria-description={dash.description}
                      >
                        {dash.title}
                        <ExternalLinkIcon
                          size={12}
                          aria-hidden
                          className="ml-1"
                        />
                      </ButtonAnchor>
                    </Tooltip>
                  ))}
                  <ButtonAnchor
                    href={grafanaExploreLogsUrl()}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                    variant="secondary"
                  >
                    Grafana Explore (Loki)
                    <ExternalLinkIcon size={12} aria-hidden className="ml-1" />
                  </ButtonAnchor>
                  <ButtonLink to="/admin/logs" size="sm" variant="text">
                    Full logs page
                  </ButtonLink>
                </div>
              </StudioPanel>

              <StudioPanel title="Services">
                <ul className="divide-border divide-y">
                  {MONITORING_SERVICES.map((svc) => {
                    const dash = GRAFANA_DASHBOARDS[svc.grafana.dashboard];
                    const active = logService === svc.logService;
                    return (
                      <li
                        key={svc.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1 basis-40">
                          <div className="font-medium">{svc.label}</div>
                          <div className="text-foreground-secondary text-xs">
                            {svc.description}
                            {svc.grafana.note ? ` · ${svc.grafana.note}` : ''}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ButtonAnchor
                            href={grafanaDashboardUrl(dash.uid)}
                            target="_blank"
                            rel="noreferrer"
                            size="sm"
                            variant="secondary"
                          >
                            {dash.title}
                            <ExternalLinkIcon
                              size={12}
                              aria-hidden
                              className="ml-1"
                            />
                          </ButtonAnchor>
                          <ButtonAnchor
                            href={grafanaExploreLogsUrl(svc.logService)}
                            target="_blank"
                            rel="noreferrer"
                            size="sm"
                            variant="text"
                          >
                            Grafana logs
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
                            App logs
                          </ButtonLink>
                          <Button
                            type="button"
                            size="sm"
                            variant={active ? 'secondary' : 'text'}
                            onClick={() => {
                              setLogService(
                                active ? undefined : svc.logService,
                              );
                            }}
                          >
                            {active ? 'Clear filter' : 'Filter below'}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </StudioPanel>

              <StudioPanel title="Vital services (Grafana)">
                <div className="border-border bg-background-secondary aspect-[16/10] w-full overflow-hidden rounded-md border">
                  <iframe
                    title="Tahti vital services — Grafana"
                    src={embedSrc}
                    className="h-full w-full border-0"
                    referrerPolicy="no-referrer-when-downgrade"
                    allow="fullscreen"
                  />
                </div>
                <p className="text-foreground-secondary mt-2 text-xs">
                  <ButtonAnchor
                    href={grafanaDashboardUrl(vitalUid)}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                    variant="text"
                    className="!px-0"
                  >
                    Open full vital services dashboard
                    <ExternalLinkIcon size={12} aria-hidden className="ml-1" />
                  </ButtonAnchor>
                </p>
              </StudioPanel>

              <div id="container-logs">
                <ContainerLogsPanel
                  service={logService}
                  title={
                    logService
                      ? `Container logs · ${logService}`
                      : 'Container logs (all services)'
                  }
                  heightClassName="h-[55vh]"
                />
              </div>
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
