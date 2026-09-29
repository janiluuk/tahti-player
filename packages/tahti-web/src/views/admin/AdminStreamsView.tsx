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
          <ViewShell title="Streams" classes={{ root: 'px-0 pt-0' }}>
            <div className="flex flex-col gap-6">
              <AdminStreamManagerPanel />
              <ChannelRotationPanel />
              <ChannelTracksPanel />
            </div>
          </ViewShell>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
