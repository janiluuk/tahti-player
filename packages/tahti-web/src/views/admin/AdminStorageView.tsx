import { useSearch } from '@tanstack/react-router';
import { CloudIcon, HardDriveIcon } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  Tabs,
  ViewShell,
} from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { FilesBrowserTab } from './storage/FilesBrowserTab';
import { StorageOverviewTab } from './storage/StorageOverviewTab';

export function AdminStorageView() {
  const { t } = useTranslation('web');
  const search = useSearch({ strict: false }) as { tab?: string };
  const [tab, setTab] = useState<'storage' | 'files'>(
    search.tab === 'files' ? 'files' : 'storage',
  );

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/storage">
          <div className="flex max-w-6xl flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminStorageView.admin')}
              </BreadcrumbLink>
              <AdminHubBreadcrumb hub="platform" />
              <BreadcrumbLink to="/admin/storage">
                {t('adminStorageView.storage')}
              </BreadcrumbLink>
              <BreadcrumbCurrent>
                {tab === 'files'
                  ? t('adminStorageViewStates.files')
                  : t('adminStorageViewStates.storage')}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={t('adminStorageView.storage')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <Tabs
                selectedIndex={tab === 'storage' ? 0 : 1}
                onChange={(index) => setTab(index === 0 ? 'storage' : 'files')}
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
            </ViewShell>{' '}
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
