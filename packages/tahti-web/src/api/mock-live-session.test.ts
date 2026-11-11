// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  getMockChannelState,
  getMockIngest,
  getMockSignalConnected,
  isMockChannelLive,
  mockSimulateSignal,
  setMockChannelLive,
  setMockChannelOffline,
  setMockLiveSlug,
  setMockReconnecting,
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
      reconnectDeadline: null,
    });
    expect(isMockChannelLive('lifecycle-artist')).toBe(true);
    expect(isMockChannelLive('midnight-archive')).toBe(false);
  });

  it('reports a dropped LIVE encoder as reconnecting until it comes back', () => {
    setMockChannelLive('lifecycle-artist');
    setMockReconnecting('2026-11-10T21:04:00.000Z');
    expect(getMockIngest()).toEqual({
      ingest: 'reconnecting',
      reconnectDeadline: '2026-11-10T21:04:00.000Z',
    });
    expect(getMockChannelState()).toBe('LIVE');
    mockSimulateSignal(true);
    expect(getMockIngest()).toEqual({
      ingest: 'connected',
      reconnectDeadline: null,
    });
  });
});
