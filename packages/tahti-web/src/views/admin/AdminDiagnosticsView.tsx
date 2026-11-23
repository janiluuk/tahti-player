import { FileTextIcon, MapIcon, PuzzleIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { HubCards, ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { renderHubLink } from '../../components/HubLink';

/** Platform → Diagnostics: Logs, Orphan pages and Map as hub cards. */
export function AdminDiagnosticsView() {
  const { t } = useTranslation('web');
  const items = [
    {
      id: 'logs',
      href: '/admin/logs',
      icon: FileTextIcon,
      title: t('adminPages.logs'),
      description: t('adminPages.logsDescription'),
    },
    {
      id: 'orphan-pages',
      href: '/admin/orphan-pages',
      icon: PuzzleIcon,
      title: t('adminPages.orphanPages'),
      description: t('adminPages.orphanPagesDescription'),
    },
    {
      id: 'map',
      href: '/admin/map',
      icon: MapIcon,
      title: t('adminPages.map'),
      description: t('adminPages.mapDescription'),
    },
  ];

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/diagnostics">
          <div className="flex max-w-5xl flex-col gap-4">
            <ViewShell
              title={t('adminPages.diagnostics')}
              subtitle={t('adminPages.diagnosticsDescription')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <HubCards
                aria-label={t('adminDiagnosticsView.toolsAria')}
                items={items}
                renderLink={renderHubLink}
              />
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
