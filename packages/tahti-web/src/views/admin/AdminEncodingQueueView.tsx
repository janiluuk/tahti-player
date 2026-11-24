import { useTranslation } from '@tahti-player/i18n';
import { ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { QueuesJobsPanel } from './status/QueuesJobsPanel';

export function AdminEncodingQueueView() {
  const { t } = useTranslation('web');
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/encoding-queue">
          <div className="flex max-w-5xl flex-col gap-6">
            <ViewShell
              title={t('adminPages.encodingQueue')}
              subtitle={t('adminPages.encodingQueueDescription')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <QueuesJobsPanel />
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
