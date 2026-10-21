export type FanCheckoutReturnSearch = {
  subscribed?: 1;
  canceled?: 1;
};

export type FanCheckoutReturn = 'subscribed' | 'canceled' | null;

function isFlagSet(value: unknown): boolean {
  return value === 1 || value === '1' || value === true || value === 'true';
}

/** Stripe Checkout returns to `/u/:username/subscribe?subscribed=1` or
 * `?canceled=1` (tahti-org `routes/fansubs/subscriptions.ts`). */
export function parseFanCheckoutReturnSearch(
  search: Record<string, unknown>,
): FanCheckoutReturnSearch {
  return {
    subscribed: isFlagSet(search.subscribed) ? 1 : undefined,
    canceled: isFlagSet(search.canceled) ? 1 : undefined,
  };
}

export function fanCheckoutReturn(
  search: FanCheckoutReturnSearch,
): FanCheckoutReturn {
  if (search.subscribed) {
    return 'subscribed';
  }
  if (search.canceled) {
    return 'canceled';
  }
  return null;
}
