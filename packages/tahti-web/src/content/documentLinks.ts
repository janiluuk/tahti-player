import type { TFunction } from '@tahti-player/i18n';

export type DocumentLink = { title: string; description: string; to: string };

/**
 * The cooperative's governance records. They live in Studio → Governance →
 * Documents, never at the top of Help (user decision 2026-09-28,
 * docs/DECISIONS.md).
 */
export function governanceDocuments(
  t: TFunction<'web'>,
): ReadonlyArray<DocumentLink> {
  return [
    {
      title: t('documentLinks.aboutTahti'),
      description: t('documentLinks.missionCooperativeStructureAndCommitments'),
      to: '/about',
    },
    {
      title: t('documentLinks.governanceHistory'),
      description: t('documentLinks.pastMotionsMeetingsAndTheir'),
      to: '/governance/history',
    },
    {
      title: t('documentLinks.transparencyDashboard'),
      description: t('documentLinks.currentLedgerGrantsAndPublic'),
      to: '/transparency',
    },
    {
      title: t('documentLinks.grantReports'),
      description: t('documentLinks.browseAnnualGrantDistributionReports'),
      to: '/transparency',
    },
    {
      title: t('documentLinks.transparencyMethodology'),
      description: t('documentLinks.howFiguresAreRecordedReviewed'),
      to: '/transparency/methodology',
    },
  ];
}

/** Policies and service pages every user may need; the bottom of Help. */
export function serviceDocuments(
  t: TFunction<'web'>,
): ReadonlyArray<DocumentLink> {
  return [
    {
      title: t('documentLinks.termsOfService'),
      description: t('documentLinks.theRulesForUsingTahti'),
      to: '/terms',
    },
    {
      title: t('documentLinks.privacyPolicy'),
      description: t('documentLinks.whatDataIsCollectedAnd'),
      to: '/privacy',
    },
    {
      title: t('documentLinks.agplSourceLicence'),
      description: t('documentLinks.theLicenceAndSourceCode'),
      to: '/agpl',
    },
    {
      title: t('documentLinks.platformStatus'),
      description: t('documentLinks.currentServiceHealthAndIncident'),
      to: '/status',
    },
    {
      title: t('documentLinks.platformNews'),
      description: t('documentLinks.newsServiceUpdatesAndPosts'),
      to: '/news',
    },
    {
      title: t('documentLinks.adminGuide'),
      description: t('documentLinks.operationalGuidanceForBoardAnd'),
      to: '/help/admin-guide',
    },
  ];
}
