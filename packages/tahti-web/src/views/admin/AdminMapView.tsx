import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
} from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { MoreView } from '../MoreView';

export function AdminMapView() {
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/map">
          <div className="flex flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">Admin</BreadcrumbLink>
              <BreadcrumbCurrent>Map</BreadcrumbCurrent>
            </Breadcrumbs>
            <MoreView />
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
