export type DiscoverTab = 'discover' | 'feed' | 'artists' | 'venues' | 'groups';

export type DiscoverSearch = {
  tab?: Exclude<DiscoverTab, 'discover'>;
};

const SEARCH_TABS = new Set<Exclude<DiscoverTab, 'discover'>>([
  'feed',
  'artists',
  'venues',
  'groups',
]);

export function parseDiscoverSearch(
  search: Record<string, unknown>,
): DiscoverSearch {
  const tab = search.tab;
  return {
    tab:
      typeof tab === 'string' &&
      SEARCH_TABS.has(tab as Exclude<DiscoverTab, 'discover'>)
        ? (tab as Exclude<DiscoverTab, 'discover'>)
        : undefined,
  };
}

export function discoverTabFromSearch(tab: unknown): DiscoverTab {
  return typeof tab === 'string' &&
    SEARCH_TABS.has(tab as Exclude<DiscoverTab, 'discover'>)
    ? (tab as Exclude<DiscoverTab, 'discover'>)
    : 'discover';
}
