import { describe, expect, it } from 'vitest';

import {
  fanSubscriptionStatusLabel,
  hasPortalManagedSubscription,
  isCanceledAtPeriodEnd,
} from './fanSubscriptionStatus';

const END = '2026-11-01T00:00:00.000Z';

describe('fanSubscriptionStatusLabel', () => {
  it('shows the end date for a canceled subscription', () => {
    expect(
      fanSubscriptionStatusLabel({
        state: 'CANCELED',
        canceledAt: '2026-10-01T00:00:00.000Z',
        currentPeriodEnd: END,
      }),
    ).toBe(`Ends on ${new Date(END).toLocaleDateString()}`);
  });

  it('falls back to the state when there is no period end', () => {
    expect(
      fanSubscriptionStatusLabel({
        state: 'CANCELED',
        canceledAt: '2026-10-01T00:00:00.000Z',
        currentPeriodEnd: null,
      }),
    ).toBe('CANCELED');
  });

  it('shows the state for an active subscription', () => {
    expect(
      fanSubscriptionStatusLabel({
        state: 'ACTIVE',
        canceledAt: null,
        currentPeriodEnd: END,
      }),
    ).toBe('ACTIVE');
  });
});

describe('isCanceledAtPeriodEnd', () => {
  it('is true for a canceled state even without canceledAt', () => {
    expect(isCanceledAtPeriodEnd({ state: 'CANCELED' })).toBe(true);
  });

  it('is false for an active subscription', () => {
    expect(isCanceledAtPeriodEnd({ state: 'ACTIVE', canceledAt: null })).toBe(
      false,
    );
  });
});

describe('hasPortalManagedSubscription', () => {
  const now = new Date('2026-10-15T00:00:00.000Z');

  it('includes a canceled subscription still in its paid period', () => {
    expect(
      hasPortalManagedSubscription(
        [{ state: 'CANCELED', currentPeriodEnd: END }],
        now,
      ),
    ).toBe(true);
  });

  it('excludes canceled subscriptions past their period and expired ones', () => {
    expect(
      hasPortalManagedSubscription(
        [
          { state: 'CANCELED', currentPeriodEnd: '2026-10-01T00:00:00.000Z' },
          { state: 'EXPIRED', currentPeriodEnd: END },
        ],
        now,
      ),
    ).toBe(false);
  });

  it('includes an active subscription', () => {
    expect(hasPortalManagedSubscription([{ state: 'ACTIVE' }], now)).toBe(true);
  });
});
