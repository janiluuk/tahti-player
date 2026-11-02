import { HubCards, ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import {
  ADMIN_SECTIONS,
  adminHubItems,
  AdminPageLayout,
  PRIMARY,
} from '../../components/AdminNav';
import { renderHubLink } from '../../components/HubLink';
import { PageEmpty } from '../../components/PageStates';
import type { AdminHubId } from './adminHubs';

export function AdminHubView({ hub }: { hub: AdminHubId }) {
  const path = `/admin/hubs/${hub}`;
  const section = ADMIN_SECTIONS.find((item) => item.hub === path);
  const page = PRIMARY.find((item) => item.to === path);
  const items = adminHubItems(path).map((item) => ({
    id: item.to,
    href: item.to,
    icon: item.Icon,
    title: item.label,
    description: item.description,
  }));

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current={path}>
          <div className="flex max-w-5xl flex-col gap-4">
            <ViewShell
              title={section?.label ?? 'Admin'}
              subtitle={page?.description}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              {items.length > 0 ? (
                <HubCards
                  aria-label={`${section?.label ?? 'Admin'} tools`}
                  items={items}
                  renderLink={renderHubLink}
                />
              ) : (
                <PageEmpty title="Nothing here yet" />
              )}
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
