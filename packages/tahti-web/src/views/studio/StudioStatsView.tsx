import {
  BarChart3Icon,
  LayoutDashboardIcon,
  ListOrderedIcon,
} from 'lucide-react';
import { useState, type FC } from 'react';

import { TabLabel, Tabs, ViewShell } from '@tahti-player/ui';

import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { HourlyDialog } from './stats/HourlyDialog';
import { EngagementSection, KeyMetrics } from './stats/OverviewTab';
import { PlaysTab } from './stats/PlaysTab';
import { RangeControls } from './stats/RangeControls';
import { TopListsTab } from './stats/TopListsTab';
import { useStatsData } from './stats/useStatsData';

type StatsTab = 'overview' | 'plays' | 'top-lists';

const STATS_TABS: Array<{
  id: StatsTab;
  label: string;
  icon: typeof LayoutDashboardIcon;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboardIcon },
  { id: 'plays', label: 'Plays & listeners', icon: BarChart3Icon },
  { id: 'top-lists', label: 'Top lists', icon: ListOrderedIcon },
];

export const StudioStatsView: FC = () => {
  const [activeTab, setActiveTab] = useState<StatsTab>('overview');
  const state = useStatsData();

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-6xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/stats" />
        <Tabs.Root
          selectedIndex={Math.max(
            0,
            STATS_TABS.findIndex((item) => item.id === activeTab),
          )}
          onChange={(index) => {
            const next = STATS_TABS[index];
            if (next) {
              setActiveTab(next.id);
            }
          }}
        >
          <Tabs.List className="overflow-x-auto">
            {STATS_TABS.map((item) => (
              <Tabs.Tab key={item.id}>
                <TabLabel icon={<item.icon size={14} />}>{item.label}</TabLabel>
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.Root>
        <ViewShell title="Stats" classes={{ root: 'px-0 pt-0' }}>
          <RangeControls state={state} />
          <KeyMetrics state={state} active={activeTab === 'overview'} />
          <PlaysTab state={state} active={activeTab === 'plays'} />
          <TopListsTab state={state} active={activeTab === 'top-lists'} />
          <EngagementSection state={state} active={activeTab === 'overview'} />
        </ViewShell>
      </div>

      <HourlyDialog state={state} />
    </StudioGate>
  );
};
