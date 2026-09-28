export type DocumentLink = { title: string; description: string; to: string };

/**
 * The cooperative's governance records. They live in Studio → Governance →
 * Documents, never at the top of Help (user decision 2026-09-28,
 * docs/DECISIONS.md).
 */
export const GOVERNANCE_DOCUMENTS: ReadonlyArray<DocumentLink> = [
  {
    title: 'About Tahti',
    description: 'Mission, cooperative structure, and commitments.',
    to: '/about',
  },
  {
    title: 'Governance history',
    description: 'Past motions, meetings, and their outcomes.',
    to: '/governance/history',
  },
  {
    title: 'Transparency dashboard',
    description: 'Current ledger, grants, and public financial totals.',
    to: '/transparency',
  },
  {
    title: 'Grant reports',
    description: 'Browse annual grant distribution reports by year.',
    to: '/transparency',
  },
  {
    title: 'Transparency methodology',
    description: 'How figures are recorded, reviewed, and published.',
    to: '/transparency/methodology',
  },
];

/** Policies and service pages every user may need; the bottom of Help. */
export const SERVICE_DOCUMENTS: ReadonlyArray<DocumentLink> = [
  {
    title: 'Terms of service',
    description: 'The rules for using Tahti services.',
    to: '/terms',
  },
  {
    title: 'Privacy policy',
    description: 'What data is collected and how it is handled.',
    to: '/privacy',
  },
  {
    title: 'AGPL source licence',
    description: 'The licence and source-code obligations for Tahti.',
    to: '/agpl',
  },
  {
    title: 'Platform status',
    description: 'Current service health and incident information.',
    to: '/status',
  },
  {
    title: 'Platform news',
    description: 'News, service updates, and posts from the Tahti team.',
    to: '/news',
  },
  {
    title: 'Admin guide',
    description: 'Operational guidance for board and platform admins.',
    to: '/help/admin-guide',
  },
];
