import { useNavigate } from '@tanstack/react-router';
import { BanknoteIcon, FileTextIcon, FlagIcon, UsersIcon } from 'lucide-react';

import { ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import {
  ADMIN_GOVERNANCE_TABS,
  DEFAULT_ADMIN_GOVERNANCE_TAB,
  isAdminGovernanceTabId,
  type AdminGovernanceTabId,
} from './governance/governanceNav';
import { AgmTab } from './governance/tabs/AgmTab';
import { GrantsTab } from './governance/tabs/GrantsTab';
import { OverviewTab } from './governance/tabs/OverviewTab';
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
  }
}

const GOVERNANCE_TAB_ICONS: Record<AdminGovernanceTabId, typeof FlagIcon> = {
  overview: FlagIcon,
  reports: FileTextIcon,
  grants: BanknoteIcon,
  agm: UsersIcon,
};

const GOVERNANCE_TAB_ITEMS: ModerationTabItem[] = ADMIN_GOVERNANCE_TABS.map(
  (item) => ({
    ...item,
    icon: GOVERNANCE_TAB_ICONS[item.id],
  }),
);

/** One page, one tab per governance area: Overview, Annual reports, Grants,
 * AGM — these used to be four standalone `/admin/*` routes; they now
 * redirect into `/admin/governance/$tab` (router.tsx), the canonical,
 * addressable URL for each tab — same convention as `/admin/moderation/$tab`. */
export function AdminGovernanceView({ tab }: { tab?: AdminGovernanceTabId }) {
  const navigate = useNavigate();
  const active = isAdminGovernanceTabId(tab)
    ? tab
    : DEFAULT_ADMIN_GOVERNANCE_TAB;

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/governance">
          <div className="flex max-w-4xl flex-col gap-6">
            <ModerationTabs
              activeId={active}
              items={GOVERNANCE_TAB_ITEMS}
              ariaLabel="Governance sections"
              onChange={(nextId) => {
                void navigate({
                  to: '/admin/governance/$tab',
                  params: { tab: nextId as AdminGovernanceTabId },
                  replace: true,
                });
              }}
            />
            <ViewShell title="Governance" classes={{ root: 'px-0 pt-0' }}>
              {tabContent(active)}
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
