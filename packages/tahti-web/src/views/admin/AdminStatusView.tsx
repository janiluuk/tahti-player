import { useTranslation } from '@tahti-player/i18n';
import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  ViewShell,
} from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { StatusChecksPanel } from './dashboard/StatusChecksPanel';
import { QueuesJobsPanel } from './status/QueuesJobsPanel';
import { WorkersPanel } from './status/WorkersPanel';

/** Storybook surface for the status panels. The live `/admin/status` route
 * redirects into the Overview dashboard (`#status-checks`). */
export function AdminStatusView() {
  const { t } = useTranslation('web');

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin">
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
              <StatusChecksPanel />
              <QueuesJobsPanel />
              <WorkersPanel />
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
