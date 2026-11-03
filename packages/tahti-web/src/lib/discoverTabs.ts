export type DiscoverTab = 'discover' | 'feed' | 'artists' | 'venues';

export type DiscoverSearch = {
  tab?: Exclude<DiscoverTab, 'discover'>;
};

export function parseDiscoverSearch(
  search: Record<string, unknown>,
): DiscoverSearch {
  return {
    tab:
      search.tab === 'feed' ||
      search.tab === 'artists' ||
      search.tab === 'venues'
        ? search.tab
        : undefined,
  };
}

export function discoverTabFromSearch(tab: unknown): DiscoverTab {
  return tab === 'feed' || tab === 'artists' || tab === 'venues'
    ? tab
    : 'discover';
}
