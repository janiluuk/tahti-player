import { Link } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';
import { SectionShell, ViewShell } from '@tahti-player/ui';

import { HelpLinkCard } from '../components/HelpLinkCard';
import { PageBackLink } from '../components/PageBackLink';
import { governanceDocuments } from '../content/documentLinks';

/** Co-op → Documents: the cooperative's public records. */
export function GovernanceDocumentsView() {
  const { t } = useTranslation('web');
  return (
    <ViewShell
      title={t('governanceGuide.documentsTitle')}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-5xl', content: 'gap-6' }}
    >
      <PageBackLink
        to="/governance"
        label={t('governanceMembersView.governance')}
      />
      <div
        className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        data-testid="governance-documents"
      >
        {governanceDocuments(t).map((item) => (
          <Link key={item.title} to={item.to as never} className="min-w-0">
            <HelpLinkCard title={item.title} description={item.description} />
          </Link>
        ))}
      </div>
    </ViewShell>
  );
}

/** Co-op → Guide: where each part of governance happens and what a vote
 * means. */
export function GovernanceGuideView() {
  const { t } = useTranslation('web');
  return (
    <ViewShell
      title={t('governanceGuide.guideTitle')}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl', content: 'gap-6' }}
    >
      <PageBackLink
        to="/governance"
        label={t('governanceMembersView.governance')}
      />
      <div className="flex flex-col gap-6" data-testid="governance-guide">
        <SectionShell title={t('studioGovernanceView.whereGovernanceLives')}>
          <p className="text-sm leading-relaxed">
            {t('governanceGuide.whereItLives')}
          </p>
        </SectionShell>
        <SectionShell title={t('studioGovernanceView.discussions')}>
          <p className="text-sm leading-relaxed">
            {t('governanceGuide.discussionsBody')}
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
    </ViewShell>
  );
}
