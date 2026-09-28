import { Link, useNavigate } from '@tanstack/react-router';
import {
  BookOpenIcon,
  FileTextIcon,
  LandmarkIcon,
  LightbulbIcon,
} from 'lucide-react';
import { lazy, Suspense } from 'react';

import { SectionShell, TabLabel, Tabs, ViewShell } from '@tahti-player/ui';

import { HelpLinkCard } from '../../components/HelpLinkCard';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioNav } from '../../components/StudioNav';
import { GOVERNANCE_DOCUMENTS } from '../../content/documentLinks';

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

export type StudioGovernanceTab = 'motions' | 'topics' | 'documents' | 'guide';

const TAB_INDEX: Record<StudioGovernanceTab, number> = {
  motions: 0,
  topics: 1,
  documents: 2,
  guide: 3,
};
const TAB_SEARCH: Array<Record<string, string> | undefined> = [
  undefined,
  { tab: 'topics' },
  { tab: 'documents' },
  { tab: 'guide' },
];

/** The cooperative's records: transparency, grants, history, structure. */
function GovernanceDocumentsTab() {
  return (
    <SectionShell
      title="Governance documents"
      data-testid="governance-documents"
    >
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GOVERNANCE_DOCUMENTS.map((item) => (
          <Link key={item.title} to={item.to as never} className="min-w-0">
            <HelpLinkCard title={item.title} description={item.description} />
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}

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
  tab?: StudioGovernanceTab;
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
              <TabLabel icon={<FileTextIcon size={15} />}>Documents</TabLabel>
            </Tabs.Tab>
            <Tabs.Tab>
              <TabLabel icon={<BookOpenIcon size={15} />}>Guide</TabLabel>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
        <ViewShell title="Governance" classes={{ root: 'px-0 pt-0' }}>
          {tab === 'guide' ? (
            <GovernanceGuideTab />
          ) : tab === 'documents' ? (
            <GovernanceDocumentsTab />
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
