import { useNavigate } from '@tanstack/react-router';
import { LandmarkIcon, LightbulbIcon } from 'lucide-react';
import { lazy, Suspense } from 'react';

import { TabLabel, Tabs, ViewShell } from '@tahti-player/ui';

import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';

const LazyGovernanceView = lazy(() =>
  import('../GovernanceView').then((module) => ({
    default: module.GovernanceView,
  })),
);

const LazyFeatureRequestsView = lazy(() =>
  import('../FeatureRequestsView').then((module) => ({
    default: module.FeatureRequestsView,
  })),
);

export function StudioGovernanceView({
  tab = 'motions',
}: {
  tab?: 'motions' | 'topics';
}) {
  const navigate = useNavigate();

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/governance" global={true} />
        <ViewShell title="Governance" classes={{ root: 'px-0 pt-0' }}>
          <Tabs.Root
            selectedIndex={tab === 'topics' ? 1 : 0}
            onChange={(index) => {
              void navigate({
                to: '/studio/governance',
                search: index === 1 ? { tab: 'topics' } : {},
              });
            }}
          >
            <Tabs.List>
              <Tabs.Tab>
                <TabLabel icon={<LandmarkIcon size={15} />}>Motions</TabLabel>
              </Tabs.Tab>
              <Tabs.Tab>
                <TabLabel icon={<LightbulbIcon size={15} />}>Topics</TabLabel>
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>
          <Suspense fallback={<PageLoading label="Loading governance…" />}>
            {tab === 'topics' ? (
              <LazyFeatureRequestsView embedded />
            ) : (
              <LazyGovernanceView embedded />
            )}
          </Suspense>
        </ViewShell>
      </div>
    </StudioGate>
  );
}
