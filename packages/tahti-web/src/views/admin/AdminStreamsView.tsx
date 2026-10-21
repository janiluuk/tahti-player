import { Link } from '@tanstack/react-router';

import { ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { AdminStreamManagerPanel } from '../../components/AdminStreamManagerPanel';
import { ChannelRotationPanel } from './streams/ChannelRotationPanel';
import { ChannelTracksPanel } from './streams/ChannelTracksPanel';

export function AdminStreamsView() {
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/streams">
          <div className="flex flex-col gap-6">
            <nav
              aria-label="Breadcrumb"
              className="text-foreground-secondary flex flex-wrap items-center gap-1 text-xs"
            >
              <Link to="/admin" className="hover:underline">
                Admin
              </Link>
              <span aria-hidden>→</span>
              <span aria-current="page">Streams</span>
            </nav>
            <ViewShell
              title="Streams"
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              <div className="flex flex-col gap-6">
                <AdminStreamManagerPanel />
                <ChannelRotationPanel />
                <ChannelTracksPanel />
              </div>
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
