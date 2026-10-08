import { useNavigate } from '@tanstack/react-router';
import {
  FileWarningIcon,
  FlagIcon,
  LightbulbIcon,
  PaletteIcon,
  RadioIcon,
  TicketIcon,
  UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { ViewShell } from '@tahti-player/ui';

import { fetchAdminDashboard } from '../../../api/admin';
import { AdminGate } from '../../../components/AdminGate';
import { AdminPageLayout } from '../../../components/AdminNav';
import { AdminMissedShowsPanel } from '../AdminMissedShowsView';
import {
  ADMIN_MODERATION_TABS,
  DEFAULT_ADMIN_MODERATION_TAB,
  isAdminModerationTabId,
  type AdminModerationTabId,
} from './moderationNav';
import { ModerationTabs, type ModerationTabItem } from './ModerationTabs';
import { BetaTab } from './tabs/BetaTab';
import { ContentReportsTab } from './tabs/ContentReportsTab';
import { FeatureRequestsTab } from './tabs/FeatureRequestsTab';
import { RadioSubmissionsTab } from './tabs/RadioSubmissionsTab';
import { SupportTab } from './tabs/SupportTab';
import { ThemesTab } from './tabs/ThemesTab';

function tabContent(id: AdminModerationTabId) {
  switch (id) {
    case 'support':
      return <SupportTab />;
    case 'beta':
      return <BetaTab />;
    case 'radio-submissions':
      return <RadioSubmissionsTab />;
    case 'content-reports':
      return <ContentReportsTab />;
    case 'feature-requests':
      return <FeatureRequestsTab />;
    case 'missed-shows':
      return <AdminMissedShowsPanel />;
    case 'themes':
      return <ThemesTab />;
  }
}

const MODERATION_TAB_ICONS: Record<AdminModerationTabId, typeof UsersIcon> = {
  support: TicketIcon,
  beta: UsersIcon,
  'radio-submissions': RadioIcon,
  'content-reports': FlagIcon,
  'feature-requests': LightbulbIcon,
  'missed-shows': FileWarningIcon,
  themes: PaletteIcon,
};

const MODERATION_TAB_ITEMS: ModerationTabItem[] = ADMIN_MODERATION_TABS.map(
  (item) => ({
    ...item,
    icon: MODERATION_TAB_ICONS[item.id],
  }),
);

/** One page, one tab per review queue: Support, Beta applications, Radio
 * submissions, Selects, Content reports, Feature requests — see
 * moderationNav.ts. These used to be six standalone `/admin/*` routes; they
 * now redirect into `/admin/moderation/$tab` (router.tsx), which is the
 * canonical, addressable URL for each tab — same convention as
 * `/settings/$section` (SettingsView).
 * Headless UI's Tabs unmount inactive panels by default, so switching tabs
 * here re-fetches that queue rather than loading all six up front. */
export function AdminModerationView({ tab }: { tab?: AdminModerationTabId }) {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState<number>();
  const active = isAdminModerationTabId(tab)
    ? tab
    : DEFAULT_ADMIN_MODERATION_TAB;
  const selectedIndex = ADMIN_MODERATION_TABS.findIndex((t) => t.id === active);

  useEffect(() => {
    void fetchAdminDashboard().then((result) => {
      setPendingCount(
        result.data.kpis.betaQueue + result.data.kpis.openTickets,
      );
    });
  }, []);

  return (
    <AdminGate>
      <div className="admin-moderation-layout px-1 py-2">
        <AdminPageLayout
          current="/admin/moderation"
          moderationPendingCount={pendingCount}
        >
          <div className="flex max-w-5xl flex-col gap-6">
            <ModerationTabs
              activeId={
                ADMIN_MODERATION_TABS[selectedIndex < 0 ? 0 : selectedIndex].id
              }
              items={MODERATION_TAB_ITEMS}
              ariaLabel="Moderation queues"
              onChange={(nextId) => {
                void navigate({
                  to: '/admin/moderation/$tab',
                  params: { tab: nextId as AdminModerationTabId },
                  replace: true,
                });
              }}
            />
            <ViewShell
              title="Moderation"
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
