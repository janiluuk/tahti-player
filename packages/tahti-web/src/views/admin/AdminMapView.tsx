import { useTranslation } from '@tahti-player/i18n';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { MoreView } from '../MoreView';

export function AdminMapView() {
  const { t } = useTranslation('web');
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/map" parent="diagnostics">
          <div className="flex flex-col gap-6">
            <MoreView
              title={t('adminPages.map')}
              subtitle={t('adminPages.mapDescription')}
            />
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
