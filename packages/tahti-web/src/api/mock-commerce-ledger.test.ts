import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearMockCommerceLedger,
  listMockCommerceAudit,
  listMockCommerceFanSubs,
  listMockCommerceTrackOrders,
  mockUserOwnsPurchaseTier,
  recordMockFanSub,
  recordMockTrackPurchase,
} from './mock-commerce-ledger';

describe('mock-commerce-ledger', () => {
  beforeEach(() => {
    clearMockCommerceLedger();
  });

  it('records a fan subscription and audit row', () => {
    recordMockFanSub({
      fanUsername: 'fan-a',
      fanDisplayName: 'Fan A',
      artistUsername: 'artist',
      tierName: 'Supporter',
      amountCents: 500,
    });
    expect(listMockCommerceFanSubs()).toHaveLength(1);
    expect(listMockCommerceAudit()[0]?.action).toBe('FAN_SUBSCRIPTION_CREATE');
  });

  it('records a track purchase entitlement and ledger audit', () => {
    recordMockTrackPurchase({
      fanUsername: 'fan-b',
      fanDisplayName: 'Fan B',
      artistUsername: 'artist',
      title: 'riff.wav',
      amountCents: 500,
      tierId: 'tier-1',
    });
    expect(listMockCommerceTrackOrders()[0]?.title).toBe('riff.wav');
    expect(mockUserOwnsPurchaseTier('fan-b', 'tier-1')).toBe(true);
    expect(listMockCommerceAudit()[0]?.action).toBe('LEDGER_ENTRY_CREATE');
  });
});
