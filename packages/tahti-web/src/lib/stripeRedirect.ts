const STRIPE_HOST_SUFFIXES = ['.stripe.com', '.stripe.network'] as const;

function isStripeHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'stripe.com') {
    return true;
  }
  return STRIPE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/** True when `url` is https and points at a known Stripe checkout/billing host. */
export function isAllowedStripeRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:') {
      return false;
    }
    return isStripeHost(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Navigate to a Stripe Checkout / Customer Portal URL after host allowlist check.
 * Returns false when the URL is rejected (caller should toast / stay put).
 */
export function assignStripeRedirectUrl(url: string): boolean {
  if (!isAllowedStripeRedirectUrl(url)) {
    return false;
  }
  window.location.assign(url);
  return true;
}
