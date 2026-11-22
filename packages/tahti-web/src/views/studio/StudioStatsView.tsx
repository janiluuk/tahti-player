import { useNavigate } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  BarChart3Icon,
  ListOrderedIcon,
  UsersIcon,
} from 'lucide-react';
import type { FC } from 'react';

import { useTranslation, type TFunction } from '@tahti-player/i18n';
import { ButtonLink, Tabs, ViewShell } from '@tahti-player/ui';

import { PageError } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { AudienceTab } from './stats/AudienceTab';
import { HourlyDialog } from './stats/HourlyDialog';
import { OverviewTab } from './stats/OverviewTab';
import { PlaysTab } from './stats/PlaysTab';
import { RangeControls } from './stats/RangeControls';
import { TopListsTab } from './stats/TopListsTab';
import { useStatsData } from './stats/useStatsData';

export type StatsTab = 'overview' | 'plays' | 'audience' | 'top-lists';

const TAB_IDS: StatsTab[] = ['overview', 'plays', 'audience', 'top-lists'];

function statsTabLabels(t: TFunction<'web'>) {
  return {
    overview: t('studioStatsViewMore.overview'),
    plays: t('studioStatsViewMore.plays'),
    audience: t('studioStatsViewMore.audience'),
    'top-lists': t('studioStatsViewMore.topLists'),
  } as const;
}

export const StudioStatsView: FC<{ tab?: StatsTab }> = ({
  tab: activeTab = 'overview',
}) => {
  const { t } = useTranslation('web');
  const navigate = useNavigate();
  const state = useStatsData();
  const labels = statsTabLabels(t);
  const selectedIndex = Math.max(0, TAB_IDS.indexOf(activeTab));

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-6xl flex-col gap-6 px-1 py-2">
        <ViewShell
          title={t('studioStatsView.stats')}
          subtitle={t('studioStatsView.subtitle')}
          classes={{ root: 'px-0 pt-0', content: 'gap-4' }}
          actions={
            <ButtonLink to="/studio/insights" size="sm" variant="secondary">
              <BarChart3Icon size={14} aria-hidden />
              <span className="ml-1.5">
                {t('studioStatsViewMore.insights')}
              </span>
            </ButtonLink>
          }
        >
          <RangeControls state={state} />
          {state.loadError && !state.loading ? (
            <PageError
              title={t('loadErrors.couldNotLoadYourStats')}
              description={state.loadError}
              onRetry={state.reload}
            />
          ) : (
            <Tabs
              variant="underline"
              selectedIndex={selectedIndex}
              onChange={(index) => {
                const next = TAB_IDS[index] ?? 'overview';
                void navigate({
                  to: '/studio/stats',
                  search: next === 'overview' ? {} : { tab: next },
                });
              }}
              listClassName="flex-wrap"
              panelClassName="pt-4"
              items={[
                {
                  id: 'overview',
                  label: labels.overview,
                  icon: <BarChart3Icon size={14} />,
                  content: <OverviewTab state={state} />,
                },
                {
                  id: 'plays',
                  label: labels.plays,
                  icon: <AudioLinesIcon size={14} />,
                  content: <PlaysTab state={state} />,
                },
                {
                  id: 'audience',
                  label: labels.audience,
                  icon: <UsersIcon size={14} />,
                  content: <AudienceTab state={state} />,
                },
                {
                  id: 'top-lists',
                  label: labels['top-lists'],
                  icon: <ListOrderedIcon size={14} />,
                  content: <TopListsTab state={state} />,
                },
              ]}
            />
          )}
        </ViewShell>
      </div>

      <HourlyDialog state={state} />
    </StudioGate>
  );
};
