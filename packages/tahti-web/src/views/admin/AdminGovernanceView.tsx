import {
  ArrowLeftIcon,
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
  ButtonLink,
  HubCards,
  ViewShell,
} from '@tahti-player/ui';

import { AdminGate } from '../../components/AdminGate';
import { AdminHubBreadcrumb } from '../../components/AdminHubBreadcrumb';
import { AdminPageLayout } from '../../components/AdminNav';
import { renderHubLink } from '../../components/HubLink';
import { DiscussionsAdminPanel } from './governance/discussions/DiscussionsAdminPanel';
import {
  adminGovernanceTabs,
  isAdminGovernanceTabId,
  type AdminGovernanceTabId,
} from './governance/governanceNav';
import { AgmTab } from './governance/tabs/AgmTab';
import { BoardTab } from './governance/tabs/BoardTab';
import { GrantsTab } from './governance/tabs/GrantsTab';
import { OverviewTab } from './governance/tabs/OverviewTab';
import { RecordsTab } from './governance/tabs/RecordsTab';
import { ReportsTab } from './governance/tabs/ReportsTab';

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

const GOVERNANCE_DESCRIPTION_KEYS = {
  overview: 'adminGovernanceHub.overviewDescription',
  reports: 'adminGovernanceHub.reportsDescription',
  grants: 'adminGovernanceHub.grantsDescription',
  agm: 'adminGovernanceHub.agmDescription',
  board: 'adminGovernanceHub.boardDescription',
  discussions: 'adminGovernanceHub.discussionsDescription',
  records: 'adminGovernanceHub.recordsDescription',
} as const;

function governanceHubItems(t: TFunction<'web'>) {
  return adminGovernanceTabs(t).map((item) => ({
    id: item.id,
    href: `/admin/governance/${item.id}`,
    icon: GOVERNANCE_TAB_ICONS[item.id],
    title: item.label,
    description: t(GOVERNANCE_DESCRIPTION_KEYS[item.id]),
  }));
}

/** Co-op → Governance: hub of area cards at `/admin/governance`, focused
 * page with a back link at `/admin/governance/$tab` (no second tab row). */
export function AdminGovernanceView({ tab }: { tab?: AdminGovernanceTabId }) {
  const { t } = useTranslation('web');
  const active = isAdminGovernanceTabId(tab) ? tab : null;
  const activeLabel = active
    ? (adminGovernanceTabs(t).find((item) => item.id === active)?.label ??
      t('adminGovernanceView.governance'))
    : t('adminGovernanceView.governance');

  if (!active) {
    return (
      <AdminGate>
        <div className="admin-page-layout px-1 py-2">
          <AdminPageLayout current="/admin/governance">
            <div className="flex max-w-5xl flex-col gap-4">
              <Breadcrumbs>
                <BreadcrumbLink to="/admin">
                  {t('adminGovernanceView.admin')}
                </BreadcrumbLink>
                <AdminHubBreadcrumb hub="coop" />
                <BreadcrumbCurrent>
                  {t('adminGovernanceView.governance')}
                </BreadcrumbCurrent>
              </Breadcrumbs>
              <ViewShell
                title={t('adminGovernanceView.governance')}
                subtitle={t('adminGovernanceHub.subtitle')}
                classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
              >
                <HubCards
                  aria-label={t('adminGovernanceHub.toolsAria')}
                  items={governanceHubItems(t)}
                  renderLink={renderHubLink}
                />
              </ViewShell>
            </div>
          </AdminPageLayout>
        </div>
      </AdminGate>
    );
  }

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
            <ButtonLink
              to="/admin/governance"
              size="sm"
              variant="text"
              className="w-fit gap-1.5"
              data-testid="admin-governance-back"
              aria-label={t('adminGovernanceHub.backToGovernance')}
            >
              <ArrowLeftIcon size={16} aria-hidden />
              {t('adminGovernanceView.governance')}
            </ButtonLink>
            <ViewShell
              title={activeLabel}
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
