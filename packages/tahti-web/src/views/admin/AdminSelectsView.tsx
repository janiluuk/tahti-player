import { useTranslation } from '@tahti-player/i18n';
import { ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { SelectsTab } from './moderation/tabs/SelectsTab';

export function AdminSelectsView() {
  const { t } = useTranslation('web');
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/tahti-selects">
          <div className="flex flex-col gap-6">
            <ViewShell
              title={t('adminSelectsView.tahtiSelects')}
              subtitle={t('adminPages.tahtiSelectsDescription')}
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
