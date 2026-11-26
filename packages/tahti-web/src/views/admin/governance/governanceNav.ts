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

/** Hub cards on `/admin/governance`; each area opens
 * `/admin/governance/$tab`. Legacy `/admin/reports`, `/admin/grants`, and
 * `/admin/agm` redirect into those URLs. */
export function adminGovernanceTabs(
  t: TFunction<'web'>,
): AdminGovernanceTabItem[] {
  return [
    { id: 'overview', label: t('governanceNav.overview') },
    { id: 'reports', label: t('governanceNav.annualReports') },
    { id: 'grants', label: t('governanceNav.grants') },
    { id: 'agm', label: t('governanceNav.agm') },
    { id: 'board', label: t('governanceNav.board') },
    { id: 'discussions', label: t('governanceNav.discussions') },
    { id: 'records', label: t('governanceNav.records') },
  ];
}

export function isAdminGovernanceTabId(
  value: string | undefined,
): value is AdminGovernanceTabId {
  return Boolean(
    value && adminGovernanceTabs(webT()).some((tab) => tab.id === value),
  );
}
