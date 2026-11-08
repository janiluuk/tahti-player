import { useTranslation } from '@tahti-player/i18n';
import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  ViewShell,
} from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { AdminStreamManagerPanel } from '../../components/AdminStreamManagerPanel';
import { ChannelRotationPanel } from './streams/ChannelRotationPanel';
import { ChannelTracksPanel } from './streams/ChannelTracksPanel';

export function AdminStreamsView() {
  const { t } = useTranslation('web');
  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/streams">
          <div className="flex flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminStreamsView.admin')}
              </BreadcrumbLink>
              <AdminHubBreadcrumb hub="platform" />
              <BreadcrumbCurrent>
                {t('adminStreamsView.streams')}
              </BreadcrumbCurrent>
            </Breadcrumbs>
            <ViewShell
              title={t('adminStreamsView.streams')}
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
