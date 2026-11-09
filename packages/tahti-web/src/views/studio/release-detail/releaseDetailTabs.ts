/** Studio release detail content tabs (URL `?tab=`). */
export const RELEASE_DETAIL_TABS = [
  'overview',
  'links',
  'stats',
  'advanced',
] as const;

export type ReleaseDetailTabId = (typeof RELEASE_DETAIL_TABS)[number];

/** Tab ids from before the 7 → 4 regroup, so old links land in the right
 * place. */
const LEGACY_TABS: Record<string, ReleaseDetailTabId> = {
  credits: 'overview',
  'smart-links': 'links',
  export: 'links',
  versions: 'advanced',
  fingerprinting: 'advanced',
};

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
  if (isReleaseDetailTabId(tab)) {
    return tab;
  }
  return (tab && LEGACY_TABS[tab]) || 'overview';
}

/** DOM id of a track row on the Links tab, so other tabs can scroll to it. */
export function releaseTrackRowId(trackId: string): string {
  return `release-track-${trackId}`;
}
