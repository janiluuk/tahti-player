import { Link } from '@tanstack/react-router';

import { ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { SelectsTab } from './moderation/tabs/SelectsTab';

export function AdminSelectsView() {
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/tahti-selects">
          <div className="flex flex-col gap-6">
            <nav
              aria-label="Breadcrumb"
              className="text-foreground-secondary flex flex-wrap items-center gap-1 text-xs"
            >
              <Link to="/admin" className="hover:underline">
                Admin
              </Link>
              <span aria-hidden>→</span>
              <span aria-current="page">Tahti Selects</span>
            </nav>
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
