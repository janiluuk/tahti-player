import { describe, expect, it } from 'vitest';

import { GO_LIVE_TABS, goLiveTabFromSearch, isGoLiveTabId } from './goLiveTabs';

describe('goLiveTabs', () => {
  it('lists Prep · Credentials · Recording · Destinations · Green room', () => {
    expect(GO_LIVE_TABS).toEqual([
      'prep',
      'credentials',
      'recording',
      'destinations',
      'green-room',
    ]);
  });

  it('defaults unknown search to prep', () => {
    expect(goLiveTabFromSearch(undefined)).toBe('prep');
    expect(goLiveTabFromSearch('nope')).toBe('prep');
    expect(goLiveTabFromSearch('destinations')).toBe('destinations');
    expect(isGoLiveTabId('green-room')).toBe(true);
    expect(isGoLiveTabId('broadcast')).toBe(false);
  });
});
