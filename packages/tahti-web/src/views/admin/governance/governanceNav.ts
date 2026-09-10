export type AdminGovernanceTabId = 'overview' | 'reports' | 'grants' | 'agm';

export type AdminGovernanceTabItem = {
  id: AdminGovernanceTabId;
  label: string;
};

/** One admin page, one tab per governance area — see AdminGovernanceView.
 * These used to be four standalone `/admin/*` routes (`/admin/governance`,
 * `/admin/reports`, `/admin/grants`, `/admin/agm`); they now redirect into
 * `/admin/governance/$tab`, the canonical addressable URL for each tab —
 * same convention as `/admin/moderation/$tab`. */
export const ADMIN_GOVERNANCE_TABS: AdminGovernanceTabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'reports', label: 'Annual reports' },
  { id: 'grants', label: 'Grants' },
  { id: 'agm', label: 'AGM' },
];

export const DEFAULT_ADMIN_GOVERNANCE_TAB: AdminGovernanceTabId = 'overview';

export function isAdminGovernanceTabId(
  value: string | undefined,
): value is AdminGovernanceTabId {
  return Boolean(value && ADMIN_GOVERNANCE_TABS.some((t) => t.id === value));
}
