import { useNavigate, useSearch } from '@tanstack/react-router';
import { CloudIcon, HardDriveIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Tabs, ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { FilesBrowserTab } from './storage/FilesBrowserTab';
import { StorageOverviewTab } from './storage/StorageOverviewTab';

export function AdminStorageView() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: string };
  const tab = search.tab === 'files' ? 'files' : 'storage';

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/storage">
          <div className="flex max-w-6xl flex-col gap-6">
            <ViewShell
              title={t('adminStorageView.storage')}
              subtitle={t('adminPages.storageDescription')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <Tabs
                selectedIndex={tab === 'storage' ? 0 : 1}
                onChange={(index) => {
                  void navigate({
                    to: '/admin/storage',
                    search: index === 1 ? { tab: 'files' } : {},
                    replace: true,
                  });
                }}
                listClassName="border-border border-b pb-3"
                panelClassName="pt-2"
                items={[
                  {
                    id: 'storage',
                    label: t('adminStorageViewMore.storage'),
                    icon: <HardDriveIcon size={14} />,
                    content: <StorageOverviewTab />,
                  },
                  {
                    id: 'files',
                    label: t('adminStorageViewMore.files'),
                    icon: <CloudIcon size={14} />,
                    content: <FilesBrowserTab />,
                  },
                ]}
              />
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
