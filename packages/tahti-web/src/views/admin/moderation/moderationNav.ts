import type { ParseKeys } from '@tahti-player/i18n';

type WebKey = ParseKeys<'web'>;

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
  labelKey: WebKey;
};

/** One admin page, one tab per review queue — see AdminModerationView. Order
 * mirrors how often the board actually triages these day to day. */
export const ADMIN_MODERATION_TABS: AdminModerationTabItem[] = [
  { id: 'support', labelKey: 'adminModeration.support' },
  { id: 'beta', labelKey: 'adminModeration.beta' },
  { id: 'radio-submissions', labelKey: 'adminModeration.radioSubmissions' },
  { id: 'content-reports', labelKey: 'adminModeration.contentReports' },
  { id: 'feature-requests', labelKey: 'adminModeration.featureRequests' },
  { id: 'missed-shows', labelKey: 'adminModeration.missedShows' },
  { id: 'themes', labelKey: 'adminModeration.themes' },
];

export const DEFAULT_ADMIN_MODERATION_TAB: AdminModerationTabId = 'support';

export function isAdminModerationTabId(
  value: string | undefined,
): value is AdminModerationTabId {
  return Boolean(value && ADMIN_MODERATION_TABS.some((t) => t.id === value));
}
