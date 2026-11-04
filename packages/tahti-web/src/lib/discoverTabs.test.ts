import { describe, expect, it } from 'vitest';

import { discoverTabFromSearch, parseDiscoverSearch } from './discoverTabs';

describe('discover search', () => {
  it('treats feed, artists, groups and venues as tabs and ignores anything else', () => {
    expect(parseDiscoverSearch({ tab: 'venues' })).toEqual({ tab: 'venues' });
    expect(parseDiscoverSearch({ tab: 'artists' })).toEqual({ tab: 'artists' });
    expect(parseDiscoverSearch({ tab: 'groups' })).toEqual({ tab: 'groups' });
    expect(parseDiscoverSearch({ tab: 'feed' })).toEqual({ tab: 'feed' });
    expect(parseDiscoverSearch({ tab: 'discover' })).toEqual({
      tab: undefined,
    });
    expect(parseDiscoverSearch({})).toEqual({ tab: undefined });
  });

  it('maps search onto the active Discover tab', () => {
    expect(discoverTabFromSearch('venues')).toBe('venues');
    expect(discoverTabFromSearch('artists')).toBe('artists');
    expect(discoverTabFromSearch('groups')).toBe('groups');
    expect(discoverTabFromSearch('discover')).toBe('discover');
    expect(discoverTabFromSearch(undefined)).toBe('discover');
  });
});
