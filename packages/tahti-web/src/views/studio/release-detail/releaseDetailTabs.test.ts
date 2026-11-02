import { describe, expect, it } from 'vitest';

import {
  isReleaseDetailTabId,
  RELEASE_DETAIL_TABS,
  releaseDetailTabFromSearch,
} from './releaseDetailTabs';

describe('releaseDetailTabs', () => {
  it('lists the four content tabs', () => {
    expect(RELEASE_DETAIL_TABS).toEqual([
      'overview',
      'links',
      'stats',
      'advanced',
    ]);
  });

  it('defaults unknown search to overview', () => {
    expect(releaseDetailTabFromSearch(undefined)).toBe('overview');
    expect(releaseDetailTabFromSearch('artwork')).toBe('overview');
    expect(isReleaseDetailTabId('links')).toBe(true);
    expect(isReleaseDetailTabId('export')).toBe(false);
  });

  it('sends the old seven tab ids to their new home', () => {
    expect(releaseDetailTabFromSearch('credits')).toBe('overview');
    expect(releaseDetailTabFromSearch('smart-links')).toBe('links');
    expect(releaseDetailTabFromSearch('export')).toBe('links');
    expect(releaseDetailTabFromSearch('versions')).toBe('advanced');
    expect(releaseDetailTabFromSearch('fingerprinting')).toBe('advanced');
  });
});
