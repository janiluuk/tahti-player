import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  assignStripeRedirectUrl,
  isAllowedStripeRedirectUrl,
} from './stripeRedirect';

describe('isAllowedStripeRedirectUrl', () => {
  it('allows https Stripe hosts', () => {
    expect(
      isAllowedStripeRedirectUrl('https://checkout.stripe.com/c/pay/cs_test'),
    ).toBe(true);
    expect(
      isAllowedStripeRedirectUrl('https://billing.stripe.com/session/abc'),
    ).toBe(true);
    expect(isAllowedStripeRedirectUrl('https://pay.stripe.com/invoice/1')).toBe(
      true,
    );
  });

  it('rejects non-https and non-Stripe hosts', () => {
    expect(
      isAllowedStripeRedirectUrl('http://checkout.stripe.com/c/pay/cs_test'),
    ).toBe(false);
    expect(isAllowedStripeRedirectUrl('https://evil.example/checkout')).toBe(
      false,
    );
    expect(isAllowedStripeRedirectUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('assignStripeRedirectUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('assigns only allowlisted URLs', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });
    expect(
      assignStripeRedirectUrl('https://checkout.stripe.com/c/pay/cs_test'),
    ).toBe(true);
    expect(assign).toHaveBeenCalledWith(
      'https://checkout.stripe.com/c/pay/cs_test',
    );
    expect(assignStripeRedirectUrl('https://evil.example/x')).toBe(false);
    expect(assign).toHaveBeenCalledTimes(1);
  });
});
