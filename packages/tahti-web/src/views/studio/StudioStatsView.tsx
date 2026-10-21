import type { FC } from 'react';

import { ViewShell } from '@tahti-player/ui';

import { PageError } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { DownloadGatesPanel } from './stats/DownloadGatesPanel';
import { HourlyDialog } from './stats/HourlyDialog';
import { EngagementSection, KeyMetrics } from './stats/OverviewTab';
import { PlaysTab } from './stats/PlaysTab';
import { RangeControls } from './stats/RangeControls';
import { TopListsTab } from './stats/TopListsTab';
import { useStatsData } from './stats/useStatsData';

export type StatsTab = 'overview' | 'plays' | 'top-lists';

export const StudioStatsView: FC<{ tab?: StatsTab }> = ({
  tab: activeTab = 'overview',
}) => {
  const state = useStatsData();

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-6xl flex-col gap-6 px-1 py-2">
        <ViewShell
          title="Stats"
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        >
          <RangeControls state={state} />
          {state.loadError && !state.loading ? (
            <PageError
              title="Could not load your stats"
              description={state.loadError}
              onRetry={state.reload}
            />
          ) : (
            <>
              <KeyMetrics state={state} active={activeTab === 'overview'} />
              <PlaysTab state={state} active={activeTab === 'plays'} />
              <TopListsTab state={state} active={activeTab === 'top-lists'} />
              <EngagementSection
                state={state}
                active={activeTab === 'overview'}
              />
              <DownloadGatesPanel active={activeTab === 'overview'} />
            </>
          )}
        </ViewShell>
      </div>

      <HourlyDialog state={state} />
    </StudioGate>
  );
};
