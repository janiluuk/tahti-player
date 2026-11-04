import { useTranslation } from '@tahti-player/i18n';
import { HubCards, ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import {
  ADMIN_HUB_DESCRIPTION_KEYS,
  ADMIN_SECTIONS,
  adminHubItems,
  adminPageLabelKey,
  AdminPageLayout,
  adminSectionLabelKey,
} from '../../components/AdminNav';
import { renderHubLink } from '../../components/HubLink';
import { PageEmpty } from '../../components/PageStates';
import type { AdminHubId } from './adminHubs';

export function AdminHubView({ hub }: { hub: AdminHubId }) {
  const { t } = useTranslation('web');
  const path = `/admin/hubs/${hub}` as const;
  const section = ADMIN_SECTIONS.find((item) => item.hub === path);
  const sectionKey = section ? adminSectionLabelKey(section.id) : null;
  const sectionTitle = sectionKey
    ? t(sectionKey)
    : (section?.label ?? t('adminNav.title'));
  const items = adminHubItems(path).map((item) => {
    const key = adminPageLabelKey(item.to);
    return {
      id: item.to,
      href: item.to,
      icon: item.Icon,
      title: key ? t(key) : item.label,
      description: item.description,
    };
  });

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current={path}>
          <div className="flex max-w-5xl flex-col gap-4">
            <ViewShell
              title={sectionTitle}
              subtitle={t(ADMIN_HUB_DESCRIPTION_KEYS[path])}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              {items.length > 0 ? (
                <HubCards
                  aria-label={t('adminNav.hubTools', { section: sectionTitle })}
                  items={items}
                  renderLink={renderHubLink}
                />
              ) : (
                <PageEmpty title={t('adminNav.hubEmpty')} />
              )}
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
