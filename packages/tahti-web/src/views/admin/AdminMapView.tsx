import { useTranslation } from '@tahti-player/i18n';
import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
} from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { MoreView } from '../MoreView';

export function AdminMapView() {
  const { t } = useTranslation('web');
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/map">
          <div className="flex flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminMapViewText.admin')}
              </BreadcrumbLink>
              <AdminHubBreadcrumb hub="platform" />
              <BreadcrumbCurrent>Map</BreadcrumbCurrent>
            </Breadcrumbs>
            <MoreView />
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
