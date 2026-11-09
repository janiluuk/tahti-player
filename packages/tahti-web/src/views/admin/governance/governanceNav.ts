import type { TFunction } from '@tahti-player/i18n';

import { webT } from '../../../lib/webT';

export type AdminGovernanceTabId =
  | 'overview'
  | 'reports'
  | 'grants'
  | 'agm'
  | 'board'
  | 'discussions'
  | 'records';

export type AdminGovernanceTabItem = {
  id: AdminGovernanceTabId;
  label: string;
};

/** One admin page, one tab per governance area — see AdminGovernanceView.
 * These used to be four standalone `/admin/*` routes (`/admin/governance`,
 * `/admin/reports`, `/admin/grants`, `/admin/agm`); they now redirect into
 * `/admin/governance/$tab`, the canonical addressable URL for each tab —
 * same convention as `/admin/moderation/$tab`. */
export function adminGovernanceTabs(
  t: TFunction<'web'>,
): AdminGovernanceTabItem[] {
  return [
    { id: 'overview', label: t('governanceNav.overview') },
    { id: 'reports', label: t('governanceNav.annualReports') },
    { id: 'grants', label: t('governanceNav.grants') },
    { id: 'agm', label: 'AGM' },
    { id: 'board', label: t('governanceNav.board') },
    { id: 'discussions', label: t('governanceNav.discussions') },
    { id: 'records', label: t('governanceNav.records') },
  ];
}

export const DEFAULT_ADMIN_GOVERNANCE_TAB: AdminGovernanceTabId = 'overview';

export function isAdminGovernanceTabId(
  value: string | undefined,
): value is AdminGovernanceTabId {
  return Boolean(
    value && adminGovernanceTabs(webT()).some((tab) => tab.id === value),
  );
}
