/** Studio release detail content tabs (URL `?tab=`). */
export const RELEASE_DETAIL_TABS = [
  'overview',
  'smart-links',
  'credits',
  'versions',
  'fingerprinting',
  'export',
] as const;

export type ReleaseDetailTabId = (typeof RELEASE_DETAIL_TABS)[number];

export function isReleaseDetailTabId(
  value: string | undefined,
): value is ReleaseDetailTabId {
  return Boolean(
    value && (RELEASE_DETAIL_TABS as readonly string[]).includes(value),
  );
}

export function releaseDetailTabFromSearch(
  tab: string | undefined,
): ReleaseDetailTabId {
  return isReleaseDetailTabId(tab) ? tab : 'overview';
}
