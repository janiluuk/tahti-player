import { Link } from '@tanstack/react-router';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { MoreView } from '../MoreView';

export function AdminMapView() {
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/map">
          <div className="flex flex-col gap-6">
            <nav
              aria-label="Breadcrumb"
              className="text-foreground-secondary flex flex-wrap items-center gap-1 text-xs"
            >
              <Link to="/admin" className="hover:underline">
                Admin
              </Link>
              <span aria-hidden>→</span>
              <span aria-current="page">Map</span>
            </nav>
            <MoreView />
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
