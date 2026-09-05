import { ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { SelectsTab } from './moderation/tabs/SelectsTab';

export function AdminSelectsView() {
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/tahti-selects">
          <ViewShell title="Tahti Selects" classes={{ root: 'px-0 pt-0' }}>
            <SelectsTab />
          </ViewShell>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
