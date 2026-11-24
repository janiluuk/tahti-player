import { describe, expect, it } from 'vitest';

import { isHumanLive } from './channelLive';

describe('isHumanLive', () => {
  it('is true for a real go-live', () => {
    expect(
      isHumanLive({ state: 'LIVE', goneLiveAt: '2026-11-24T10:00:00Z' }),
    ).toBe(true);
  });

  it('is false while only the 24/7 rotation plays', () => {
    expect(isHumanLive({ state: 'LIVE', goneLiveAt: null })).toBe(false);
    expect(isHumanLive({ state: 'LIVE' })).toBe(false);
  });

  it('is false offline or without a channel', () => {
    expect(isHumanLive({ state: 'OFFLINE', goneLiveAt: null })).toBe(false);
    expect(isHumanLive(null)).toBe(false);
  });
});
