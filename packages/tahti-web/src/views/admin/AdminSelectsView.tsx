import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  ViewShell,
} from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { SelectsTab } from './moderation/tabs/SelectsTab';

export function AdminSelectsView() {
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/tahti-selects">
          <div className="flex flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">Admin</BreadcrumbLink>
              <BreadcrumbCurrent>Tahti Selects</BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title="Tahti Selects"
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <SelectsTab />
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
