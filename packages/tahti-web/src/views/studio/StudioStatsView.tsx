import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState, type FC } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { FilterChips, SectionTitle, ViewShell } from '@tahti-player/ui';

import { PageError } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { DownloadGatesPanel } from './stats/DownloadGatesPanel';
import { HourlyDialog } from './stats/HourlyDialog';
import { EngagementSection, KeyMetrics } from './stats/OverviewTab';
import { PlaysTab } from './stats/PlaysTab';
import { RangeControls } from './stats/RangeControls';
import { ReferrerSources } from './stats/ReferrerSources';
import { TopListsTab } from './stats/TopListsTab';
import { useStatsData } from './stats/useStatsData';

export type StatsTab = 'overview' | 'plays' | 'top-lists';

function statsSections(t: TFunction<'web'>) {
  return [
    { id: 'overview', label: t('studioStatsViewMore.overview') },
    { id: 'plays', label: t('studioStatsViewMore.playsAndListeners') },
    { id: 'top-lists', label: t('studioStatsViewMore.topLists') },
    { id: 'insights', label: t('studioStatsViewMore.insights') },
  ] as const;
}

function scrollToSection(id: string) {
  document.getElementById(`stats-${id}`)?.scrollIntoView({ block: 'start' });
}

export const StudioStatsView: FC<{ tab?: StatsTab }> = ({
  tab: activeTab = 'overview',
}) => {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const state = useStatsData();
  const ready = !state.loading && !state.loadError;
  const [section, setSection] = useState<string>(activeTab);
  // Overview sits right under the title and tabs, so landing there must not
  // scroll them away; only a deep link to a later section or a pick scrolls.
  const scrollPending = useRef(activeTab !== 'overview');

  useEffect(() => {
    setSection(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (section === 'insights' || !ready || !scrollPending.current) {
      return;
    }
    scrollPending.current = false;
    scrollToSection(section);
  }, [section, ready]);

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-6xl flex-col gap-6 px-1 py-2">
        <ViewShell
          title={t('studioStatsView.stats')}
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
        >
          <FilterChips
            aria-label={t('studioStatsView.statsSections')}
            items={statsSections(t).map((item) => ({
              id: item.id,
              label: item.label,
            }))}
            selected={section}
            onChange={(id) => {
              if (id === 'insights') {
                void navigate({ to: '/studio/insights' });
                return;
              }
              setSection(id);
              if (ready) {
                scrollToSection(id);
              } else {
                scrollPending.current = true;
              }
              const tab = id === 'plays' || id === 'top-lists' ? id : undefined;
              void navigate({
                to: '/studio/stats',
                search: tab ? { tab } : {},
              });
            }}
          />
          <RangeControls state={state} />
          {state.loadError && !state.loading ? (
            <PageError
              title={t('loadErrors.couldNotLoadYourStats')}
              description={state.loadError}
              onRetry={state.reload}
            />
          ) : (
            <>
              <section
                id="stats-overview"
                aria-label={t('studioStatsView.overview')}
                className="flex scroll-mt-4 flex-col gap-4"
              >
                <KeyMetrics state={state} active />
                <EngagementSection state={state} active />
                <ReferrerSources
                  window={{
                    range: state.range,
                    from: state.appliedCustom?.from,
                    to: state.appliedCustom?.to,
                  }}
                />
                <DownloadGatesPanel active />
              </section>
              <section
                id="stats-plays"
                aria-label={t('studioStatsView.playsAndListeners')}
                className="flex scroll-mt-4 flex-col gap-4"
              >
                <SectionTitle title={t('studioStatsView.playsAndListeners')} />
                <PlaysTab state={state} active />
              </section>
              <section
                id="stats-top-lists"
                aria-label={t('studioStatsView.topLists')}
                className="flex scroll-mt-4 flex-col gap-4"
              >
                <SectionTitle title={t('studioStatsView.topLists')} />
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
