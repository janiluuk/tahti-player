import { Link, useSearch } from '@tanstack/react-router';
import { CloudIcon, HardDriveIcon } from 'lucide-react';
import { useState } from 'react';

import { Tabs, ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { FilesBrowserTab } from './storage/FilesBrowserTab';
import { StorageOverviewTab } from './storage/StorageOverviewTab';

export function AdminStorageView() {
  const search = useSearch({ strict: false }) as { tab?: string };
  const [tab, setTab] = useState<'storage' | 'files'>(
    search.tab === 'files' ? 'files' : 'storage',
  );

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/storage">
          <div className="flex max-w-6xl flex-col gap-6">
            <nav
              aria-label="Breadcrumb"
              className="text-foreground-secondary flex flex-wrap items-center gap-1 text-xs"
            >
              <Link to="/admin" className="hover:underline">
                Admin
              </Link>
              <span aria-hidden>→</span>
              <Link to="/admin/storage" className="hover:underline">
                Storage
              </Link>
              <span aria-hidden>→</span>
              <span aria-current="page">
                {tab === 'files' ? 'Files' : 'Storage'}
              </span>
            </nav>
            <ViewShell
              title="Storage"
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
                    label: 'Storage',
                    icon: <HardDriveIcon size={14} />,
                    content: <StorageOverviewTab />,
                  },
                  {
                    id: 'files',
                    label: 'Files',
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
