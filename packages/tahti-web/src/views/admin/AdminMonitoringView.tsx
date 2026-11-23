import { useTranslation } from '@tahti-player/i18n';
import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  ViewShell,
} from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { MonitoringEmbedPanel } from './dashboard/MonitoringEmbedPanel';

/** Storybook surface for the monitoring panels. The live `/admin/monitoring`
 * route redirects into the dashboard Monitoring tab (`?tab=monitoring`). */
export function AdminMonitoringView() {
  const { t } = useTranslation('web');

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin">
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
              <MonitoringEmbedPanel />
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
