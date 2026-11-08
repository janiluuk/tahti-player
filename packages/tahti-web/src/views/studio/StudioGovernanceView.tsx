import { Link } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { SectionShell, ViewShell } from '@tahti-player/ui';

import { HelpLinkCard } from '../../components/HelpLinkCard';
import { PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
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

/** The cooperative's records: transparency, grants, history, structure. */
function GovernanceDocumentsTab() {
  const { t } = useTranslation('web');
  return (
    <SectionShell
      title={t('studioGovernanceView.governanceDocuments')}
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
  const { t } = useTranslation('web');
  return (
    <div className="flex flex-col gap-6">
      <SectionShell title={t('studioGovernanceView.whereGovernanceLives')}>
        <p className="text-sm leading-relaxed">
          Listeners open Governance from Settings → Account. Artists use Studio
          → Governance. Board users use Admin → Governance and Admin → AGM.
        </p>
        <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
          {t('studioGovernanceView.theActiveSubtabAlwaysFollows')}
        </p>
      </SectionShell>
      <SectionShell title={t('studioGovernanceView.discussions')}>
        <p className="text-sm leading-relaxed">
          The board opens discussion topics for members to talk something
          through before anything is decided. Open them from Governance →
          Discussions; every member is notified when a topic opens.
        </p>
        <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
          {t('studioGovernanceView.replyingFollowsATopicSo')}
        </p>
      </SectionShell>
      <SectionShell
        title={t('studioGovernanceView.advisoryConsultationAndOfficialVotes')}
      >
        <p className="text-sm leading-relaxed">
          {t('studioGovernanceView.advisoryDiscussionsAndVotesCollect')}
        </p>
        <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
          {t('studioGovernanceView.doNotTreatAnAdvisory')}
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
  const { t } = useTranslation('web');
  return (
    <StudioGate requireChannel={false}>
      <div className="studio-page-layout mx-auto flex max-w-5xl flex-col gap-6 px-1 py-2">
        <ViewShell
          title={t('studioGovernanceView.governance')}
          classes={{ root: 'px-0 pt-0' }}
        >
          {tab === 'guide' ? (
            <GovernanceGuideTab />
          ) : tab === 'documents' ? (
            <GovernanceDocumentsTab />
          ) : (
            <Suspense
              fallback={<PageLoading label={t('loading.loadingGovernance')} />}
            >
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
