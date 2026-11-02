import { useEffect, type FC } from 'react';

import { SectionTitle, ViewShell } from '@tahti-player/ui';

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
  const ready = !state.loading && !state.loadError;

  useEffect(() => {
    if (activeTab === 'overview' || !ready) {
      return;
    }
    document
      .getElementById(`stats-${activeTab}`)
      ?.scrollIntoView({ block: 'start' });
  }, [activeTab, ready]);

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
              <section
                id="stats-overview"
                aria-label="Overview"
                className="flex scroll-mt-4 flex-col gap-4"
              >
                <KeyMetrics state={state} active />
                <EngagementSection state={state} active />
                <DownloadGatesPanel active />
              </section>
              <section
                id="stats-plays"
                aria-label="Plays and listeners"
                className="flex scroll-mt-4 flex-col gap-4"
              >
                <SectionTitle title="Plays and listeners" />
                <PlaysTab state={state} active />
              </section>
              <section
                id="stats-top-lists"
                aria-label="Top lists"
                className="flex scroll-mt-4 flex-col gap-4"
              >
                <SectionTitle title="Top lists" />
                <TopListsTab state={state} active />
              </section>
            </>
          )}
        </ViewShell>
      </div>

      <HourlyDialog state={state} />
    </StudioGate>
  );
};
