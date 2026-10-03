import { describe, expect, it } from 'vitest';

import {
  fanCheckoutReturn,
  parseFanCheckoutReturnSearch,
} from './fanCheckoutReturn';

describe('parseFanCheckoutReturnSearch', () => {
  it('reads the Stripe success and cancel flags', () => {
    expect(parseFanCheckoutReturnSearch({ subscribed: 1 })).toEqual({
      subscribed: 1,
      canceled: undefined,
    });
    expect(parseFanCheckoutReturnSearch({ canceled: '1' })).toEqual({
      subscribed: undefined,
      canceled: 1,
    });
  });

  it('ignores unrelated or empty params', () => {
    expect(parseFanCheckoutReturnSearch({ subscribed: '0', tab: 'x' })).toEqual(
      { subscribed: undefined, canceled: undefined },
    );
  });
});

describe('fanCheckoutReturn', () => {
  it('prefers success over cancel', () => {
    expect(fanCheckoutReturn({ subscribed: 1, canceled: 1 })).toBe(
      'subscribed',
    );
    expect(fanCheckoutReturn({ canceled: 1 })).toBe('canceled');
    expect(fanCheckoutReturn({})).toBeNull();
  });
});
