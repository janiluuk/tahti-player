// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  getMockChannelState,
  getMockSignalConnected,
  isMockChannelLive,
  mockSimulateSignal,
  setMockChannelLive,
  setMockChannelOffline,
  setMockLiveSlug,
} from './mock-live-session';

const KEY = 'tahti-web-mock-live-session';

describe('mock-live-session', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setMockChannelOffline();
    setMockLiveSlug(null);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('persists signal and LIVE state across hydrate', async () => {
    mockSimulateSignal(true);
    setMockLiveSlug('lifecycle-artist');
    setMockChannelLive('lifecycle-artist');
    expect(getMockSignalConnected()).toBe(true);
    expect(getMockChannelState()).toBe('LIVE');
    expect(sessionStorage.getItem(KEY)).toContain('lifecycle-artist');

    // Re-import would re-hydrate; assert storage shape instead.
    const stored = JSON.parse(sessionStorage.getItem(KEY)!);
    expect(stored).toEqual({
      signal: true,
      state: 'LIVE',
      slug: 'lifecycle-artist',
    });
    expect(isMockChannelLive('lifecycle-artist')).toBe(true);
    expect(isMockChannelLive('midnight-archive')).toBe(false);
  });
});
