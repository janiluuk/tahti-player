import { useTranslation, type ParseKeys } from '@tahti-player/i18n';
import { BreadcrumbLink } from '@tahti-player/ui';

const ADMIN_HUB_LABEL_KEYS = {
  content: 'adminNav.sectionContent',
  coop: 'adminNav.sectionCoop',
  platform: 'adminNav.sectionPlatform',
} as const satisfies Record<string, ParseKeys<'web'>>;

export type AdminHubId = keyof typeof ADMIN_HUB_LABEL_KEYS;

/** The hub crumb between "Admin" and a hub page, matching the hub back link
 * above the page. */
export function AdminHubBreadcrumb({ hub }: { hub: AdminHubId }) {
  const { t } = useTranslation('web');
  return (
    <BreadcrumbLink
      to="/admin/hubs/$hub"
      params={{ hub }}
      data-testid="admin-hub-breadcrumb"
    >
      {t(ADMIN_HUB_LABEL_KEYS[hub])}
    </BreadcrumbLink>
  );
}
