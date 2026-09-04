import { useNavigate } from '@tanstack/react-router';
import { RadioIcon } from 'lucide-react';

import { TabLabel, Tabs, ViewShell } from '@tahti-player/ui';

import { AdminGate } from '../../../components/AdminGate';
import { AdminPageLayout } from '../../../components/AdminNav';
import {
  ADMIN_ORPHAN_PAGE_TABS,
  DEFAULT_ADMIN_ORPHAN_PAGE_TAB,
  isAdminOrphanPageTabId,
  type AdminOrphanPageTabId,
} from './orphanPagesNav';
import { RadioStationSuggestionsTab } from './tabs/RadioStationSuggestionsTab';

function tabContent(id: AdminOrphanPageTabId) {
  switch (id) {
    case 'radio-station-suggestions':
      return <RadioStationSuggestionsTab />;
  }
}

export function AdminOrphanPagesView({ tab }: { tab?: AdminOrphanPageTabId }) {
  const navigate = useNavigate();
  const active = isAdminOrphanPageTabId(tab)
    ? tab
    : DEFAULT_ADMIN_ORPHAN_PAGE_TAB;
  const selectedIndex = ADMIN_ORPHAN_PAGE_TABS.findIndex(
    (entry) => entry.id === active,
  );

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/orphan-pages">
          <Tabs.Root
            selectedIndex={selectedIndex < 0 ? 0 : selectedIndex}
            onChange={(index) => {
              void navigate({
                to: '/admin/orphan-pages/$tab',
                params: { tab: ADMIN_ORPHAN_PAGE_TABS[index].id },
                replace: true,
              });
            }}
            listClassName="flex flex-wrap gap-3"
            tabClassName="h-8 rounded-md border border-border px-2.5 text-xs font-semibold tracking-wide uppercase"
          >
            <Tabs.List aria-label="Orphan pages">
              {ADMIN_ORPHAN_PAGE_TABS.map((item) => (
                <Tabs.Tab key={item.id}>
                  <TabLabel icon={<RadioIcon size={14} />}>
                    {item.label}
                  </TabLabel>
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.Root>
          <ViewShell
            title="Orphan pages"
            subtitle="Pages with no menu entry."
            classes={{ root: 'px-0 pt-0 max-w-5xl' }}
          >
            {tabContent(active)}
          </ViewShell>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
