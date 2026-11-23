import { useNavigate, useSearch } from '@tanstack/react-router';
import { RadioTowerIcon, Settings2Icon } from 'lucide-react';

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
import { AdminStreamManagerPanel } from '../../components/AdminStreamManagerPanel';
import { ChannelRotationPanel } from './streams/ChannelRotationPanel';
import { ChannelTracksPanel } from './streams/ChannelTracksPanel';

export type AdminStreamsTab = 'live' | 'ingest';

export function AdminStreamsView() {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { tab?: string };
  const tab: AdminStreamsTab = search.tab === 'ingest' ? 'ingest' : 'live';

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
              <Tabs
                selectedIndex={tab === 'ingest' ? 1 : 0}
                onChange={(index) => {
                  void navigate({
                    to: '/admin/streams',
                    search: index === 1 ? { tab: 'ingest' } : {},
                    replace: true,
                  });
                }}
                listClassName="flex-wrap"
                panelClassName="pt-2"
                items={[
                  {
                    id: 'live',
                    label: t('adminStreamsView.liveNow'),
                    icon: <RadioTowerIcon size={14} />,
                    content: <AdminStreamManagerPanel />,
                  },
                  {
                    id: 'ingest',
                    label: t('adminStreamsView.ingestSettings'),
                    icon: <Settings2Icon size={14} />,
                    content: (
                      <div className="flex flex-col gap-6">
                        <ChannelRotationPanel />
                        <ChannelTracksPanel />
                      </div>
                    ),
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
