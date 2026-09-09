import { useNavigate } from '@tanstack/react-router';
import { BookOpenIcon, LandmarkIcon, LightbulbIcon } from 'lucide-react';
import { lazy, Suspense } from 'react';

import { SectionShell, TabLabel, Tabs, ViewShell } from '@tahti-player/ui';

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

const TAB_INDEX: Record<'motions' | 'topics' | 'guide', number> = {
  motions: 0,
  topics: 1,
  guide: 2,
};
const TAB_SEARCH: Array<Record<string, string> | undefined> = [
  undefined,
  { tab: 'topics' },
  { tab: 'guide' },
];

function GovernanceGuideTab() {
  return (
    <div className="flex flex-col gap-6">
      <SectionShell title="Where governance lives">
        <p className="text-sm leading-relaxed">
          Listeners open Governance from Settings → Account. Artists use Studio
          → Governance. Board users use Admin → Governance and Admin → AGM.
        </p>
        <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
          The active subtab always follows the page you opened, so you can use
          browser back and shared links without losing your place.
        </p>
      </SectionShell>
      <SectionShell title="Advisory consultation and official votes">
        <p className="text-sm leading-relaxed">
          Advisory discussions and votes collect member input. They are clearly
          separate from binding association decisions.
        </p>
        <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
          Do not treat an advisory result as an official AGM ballot. Official
          records are published when the association&rsquo;s eligibility,
          quorum, ballot, minutes, and result contracts are in place.
        </p>
      </SectionShell>
    </div>
  );
}

export function StudioGovernanceView({
  tab = 'motions',
}: {
  tab?: 'motions' | 'topics' | 'guide';
}) {
  const navigate = useNavigate();

  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <StudioNav current="/studio/governance" />
        <Tabs.Root
          selectedIndex={TAB_INDEX[tab]}
          onChange={(index) => {
            void navigate({
              to: '/studio/governance',
              search: TAB_SEARCH[index] ?? {},
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
            <Tabs.Tab>
              <TabLabel icon={<BookOpenIcon size={15} />}>Guide</TabLabel>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
        <ViewShell title="Governance" classes={{ root: 'px-0 pt-0' }}>
          {tab === 'guide' ? (
            <GovernanceGuideTab />
          ) : (
            <Suspense fallback={<PageLoading label="Loading governance…" />}>
              {tab === 'topics' ? (
                <LazyFeatureRequestsView embedded />
              ) : (
                <LazyGovernanceView embedded />
              )}
            </Suspense>
          )}
        </ViewShell>
      </div>
    </StudioGate>
  );
}
