import { useNavigate } from '@tanstack/react-router';
import {
  BanknoteIcon,
  FileTextIcon,
  FlagIcon,
  FolderOpenIcon,
  MessagesSquareIcon,
  ShieldCheckIcon,
  UsersIcon,
} from 'lucide-react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  BreadcrumbCurrent,
  BreadcrumbLink,
  Breadcrumbs,
  ViewShell,
} from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { DiscussionsAdminPanel } from './governance/discussions/DiscussionsAdminPanel';
import {
  adminGovernanceTabs,
  DEFAULT_ADMIN_GOVERNANCE_TAB,
  isAdminGovernanceTabId,
  type AdminGovernanceTabId,
} from './governance/governanceNav';
import { AgmTab } from './governance/tabs/AgmTab';
import { BoardTab } from './governance/tabs/BoardTab';
import { GrantsTab } from './governance/tabs/GrantsTab';
import { OverviewTab } from './governance/tabs/OverviewTab';
import { RecordsTab } from './governance/tabs/RecordsTab';
import { ReportsTab } from './governance/tabs/ReportsTab';
import {
  ModerationTabs,
  type ModerationTabItem,
} from './moderation/ModerationTabs';

function tabContent(id: AdminGovernanceTabId) {
  switch (id) {
    case 'overview':
      return <OverviewTab />;
    case 'reports':
      return <ReportsTab />;
    case 'grants':
      return <GrantsTab />;
    case 'agm':
      return <AgmTab />;
    case 'board':
      return <BoardTab />;
    case 'discussions':
      return <DiscussionsAdminPanel />;
    case 'records':
      return <RecordsTab />;
  }
}

const GOVERNANCE_TAB_ICONS: Record<AdminGovernanceTabId, typeof FlagIcon> = {
  overview: FlagIcon,
  reports: FileTextIcon,
  grants: BanknoteIcon,
  agm: UsersIcon,
  board: ShieldCheckIcon,
  discussions: MessagesSquareIcon,
  records: FolderOpenIcon,
};

function governanceTabItems(t: TFunction<'web'>): ModerationTabItem[] {
  return adminGovernanceTabs(t).map((item) => ({
    ...item,
    icon: GOVERNANCE_TAB_ICONS[item.id],
  }));
}

/** One page, one tab per governance area: Overview, Annual reports, Grants,
 * AGM — these used to be four standalone `/admin/*` routes; they now
 * redirect into `/admin/governance/$tab` (router.tsx), the canonical,
 * addressable URL for each tab — same convention as `/admin/moderation/$tab`. */
export function AdminGovernanceView({ tab }: { tab?: AdminGovernanceTabId }) {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const active = isAdminGovernanceTabId(tab)
    ? tab
    : DEFAULT_ADMIN_GOVERNANCE_TAB;
  const activeLabel =
    adminGovernanceTabs(t).find((item) => item.id === active)?.label ??
    'Overview';

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/governance">
          <div className="flex max-w-4xl flex-col gap-6">
            <Breadcrumbs>
              <BreadcrumbLink to="/admin">
                {t('adminGovernanceView.admin')}
              </BreadcrumbLink>
              <AdminHubBreadcrumb hub="coop" />
              <BreadcrumbLink to="/admin/governance">
                {t('adminGovernanceView.governance')}
              </BreadcrumbLink>
              <BreadcrumbCurrent>{activeLabel}</BreadcrumbCurrent>
            </Breadcrumbs>
            <ModerationTabs
              activeId={active}
              items={governanceTabItems(t)}
              ariaLabel="Governance sections"
              onChange={(nextId) => {
                void navigate({
                  to: '/admin/governance/$tab',
                  params: { tab: nextId as AdminGovernanceTabId },
                  replace: true,
                });
              }}
            />
            <ViewShell
              title={t('adminGovernanceView.governance')}
              classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
            >
              {tabContent(active)}
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
