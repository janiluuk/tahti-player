export type AdminModerationTabId =
  | 'support'
  | 'beta'
  | 'radio-submissions'
  | 'content-reports'
  | 'feature-requests'
  | 'missed-shows'
  | 'themes';

export type AdminModerationTabItem = {
  id: AdminModerationTabId;
  label: string;
};

/** One admin page, one tab per review queue — see AdminModerationView. Order
 * mirrors how often the board actually triages these day to day. */
export const ADMIN_MODERATION_TABS: AdminModerationTabItem[] = [
  { id: 'support', label: 'Support' },
  { id: 'beta', label: 'Beta applications' },
  { id: 'radio-submissions', label: 'Radio submissions' },
  { id: 'content-reports', label: 'Content reports' },
  { id: 'feature-requests', label: 'Feature requests' },
  { id: 'missed-shows', label: 'Missed shows' },
  { id: 'themes', label: 'Themes' },
];

export const DEFAULT_ADMIN_MODERATION_TAB: AdminModerationTabId = 'support';

export function isAdminModerationTabId(
  value: string | undefined,
): value is AdminModerationTabId {
  return Boolean(value && ADMIN_MODERATION_TABS.some((t) => t.id === value));
}
