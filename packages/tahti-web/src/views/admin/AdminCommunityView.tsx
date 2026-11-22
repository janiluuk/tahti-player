import { useTranslation } from '@tahti-player/i18n';
import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  ViewShell,
} from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { CommunityStatsPanel } from './dashboard/CommunityStatsPanel';

export function AdminCommunityView() {
  const { t } = useTranslation('web');
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/community">
          <div className="flex max-w-4xl flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminDashboard.admin')}
              </BreadcrumbLink>
              <BreadcrumbCurrent>
                {t('adminCommunityView.community')}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={t('adminCommunityView.community')}
              subtitle={t('adminCommunityView.subtitle')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <CommunityStatsPanel />
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
