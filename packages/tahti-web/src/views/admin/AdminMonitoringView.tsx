import { ExternalLinkIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Alert,
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
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

export function AdminMonitoringView() {
  const { t } = useTranslation('web');
  const vitalUid = GRAFANA_DASHBOARDS.vital.uid;
  const embedSrc = grafanaDashboardEmbedUrl(vitalUid);

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/monitoring">
          <div className="flex flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminMonitoring.admin')}
              </BreadcrumbLink>
              <BreadcrumbCurrent>
                {t('adminMonitoring.monitoring')}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={t('adminMonitoring.monitoring')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <Alert tone="neutral">
                {t('adminMonitoring.grafanaEmbedsNeedYouSigned')}
              </Alert>

              <StudioPanel title={t('adminMonitoring.grafanaDashboards')}>
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
                    {t('adminMonitoring.grafanaExploreLoki')}
                    <ExternalLinkIcon size={12} aria-hidden className="ml-1" />
                  </ButtonAnchor>
                  <ButtonLink
                    to="/admin/logs"
                    search={{ tab: 'containers' }}
                    size="sm"
                    variant="text"
                  >
                    {t('adminMonitoring.fullLogsPage')}
                  </ButtonLink>
                </div>
              </StudioPanel>

              <StudioPanel title={t('adminMonitoring.services')}>
                <ul className="divide-border divide-y">
                  {MONITORING_SERVICES.map((svc) => {
                    const dash = GRAFANA_DASHBOARDS[svc.grafana.dashboard];
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
                            {t('adminMonitoring.grafanaLogs')}
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
                            {t('adminMonitoring.appLogs')}
                          </ButtonLink>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </StudioPanel>

              <StudioPanel title={t('adminMonitoring.vitalServicesGrafana')}>
                <div className="border-border bg-background-secondary aspect-[16/10] w-full overflow-hidden rounded-md border">
                  <iframe
                    title={t('adminMonitoring.tahtiVitalServicesGrafana')}
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
                    {t('adminMonitoring.openFullVitalServicesDashboard')}
                    <ExternalLinkIcon size={12} aria-hidden className="ml-1" />
                  </ButtonAnchor>
                </p>
              </StudioPanel>
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
