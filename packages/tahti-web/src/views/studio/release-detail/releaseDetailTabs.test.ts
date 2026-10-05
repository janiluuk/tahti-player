import { describe, expect, it } from 'vitest';

import {
  isReleaseDetailTabId,
  RELEASE_DETAIL_TABS,
  releaseDetailTabFromSearch,
} from './releaseDetailTabs';

describe('releaseDetailTabs', () => {
  it('lists the six content tabs', () => {
    expect(RELEASE_DETAIL_TABS).toEqual([
      'overview',
      'smart-links',
      'credits',
      'versions',
      'fingerprinting',
      'export',
    ]);
  });

  it('defaults unknown search to overview', () => {
    expect(releaseDetailTabFromSearch(undefined)).toBe('overview');
    expect(releaseDetailTabFromSearch('smart-links')).toBe('smart-links');
    expect(isReleaseDetailTabId('export')).toBe(true);
    expect(isReleaseDetailTabId('artwork')).toBe(false);
  });
});
