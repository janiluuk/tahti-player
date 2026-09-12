import { requestJson } from './client-request';
import {
  listMockPurchases,
  listMockSubscriptions,
  mockCancelSubscription,
} from './mock-session';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';
import type {
  FanSubscriptionRow,
  MembershipStatus,
  PurchaseRow,
} from './types';

async function getJson<T>(path: string): Promise<T> {
  const { data } = await requestJson<T>(path);
  return data;
}

export async function fetchMembership(): Promise<{
  data: MembershipStatus | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: {
        status: 'ACTIVE',
        isMember: true,
        memberNumber: 42,
        memberSince: '2025-01-01T00:00:00.000Z',
        tier: 'ARTIST',
        priceCents: 4000,
        emailVerified: true,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<MembershipStatus>('/api/me/membership');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function startMembershipCheckout(opts?: {
  successPath?: string;
  cancelPath?: string;
}): Promise<
  | { ok: true; checkoutUrl: string }
  | { ok: true; activated: true; memberNumber?: number }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      activated: true,
      memberNumber: 99,
    };
  }
  try {
    const { data } = await requestJson<{
      checkoutUrl?: string | null;
      activated?: boolean;
      memberNumber?: number;
      error?: string;
    }>('/api/me/membership/checkout', {
      method: 'POST',
      body: JSON.stringify({
        successPath:
          opts?.successPath ?? '/settings/account?membership=success',
        cancelPath: opts?.cancelPath ?? '/signup/payment?membership=canceled',
      }),
    });
    if (data.checkoutUrl) {
      return { ok: true, checkoutUrl: data.checkoutUrl };
    }
    if (data.activated) {
      return {
        ok: true,
        activated: true,
        memberNumber: data.memberNumber,
      };
    }
    return { ok: false, error: data.error ?? 'Checkout did not return a URL' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Checkout failed',
    };
  }
}

/** POST /api/me/membership/portal — Stripe Customer Portal (receipts, payment method, cancel). */
export async function startMembershipPortal(): Promise<
  { ok: true; portalUrl: string } | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, portalUrl: 'https://billing.stripe.com/mock-session' };
  }
  try {
    const { data } = await requestJson<{ portalUrl?: string; error?: string }>(
      '/api/me/membership/portal',
      { method: 'POST' },
    );
    if (data.portalUrl) {
      return { ok: true, portalUrl: data.portalUrl };
    }
    return {
      ok: false,
      error: data.error ?? 'Billing portal did not return a URL',
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not open billing portal',
    };
  }
}

/** POST /api/auth/resend-verification — re-sends the email confirmation link.
 * Requires an hCaptcha token when the API has hCaptcha enforced (production);
 * tahti-web has no hCaptcha widget yet, so this surfaces that as a normal
 * error rather than pretending to succeed. */
export async function resendVerificationEmail(
  email: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, message: 'Mock verification email sent.' };
  }
  try {
    const { data } = await requestJson<{ message?: string; error?: string }>(
      '/api/auth/resend-verification',
      { method: 'POST', body: JSON.stringify({ email }) },
    );
    return { ok: true, message: data.message ?? 'Verification email sent.' };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Could not resend verification email',
    };
  }
}

export async function requestAccountDeletion(
  reason: string,
): Promise<{ ok: true; ticketId: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, ticketId: 'mock-deletion-001' };
  }
  try {
    const { data } = await requestJson<{ ticketId: string }>(
      '/api/me/account/deletion-request',
      { method: 'POST', body: JSON.stringify({ reason }) },
    );
    return { ok: true, ticketId: data.ticketId };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Deletion request failed',
    };
  }
}

export async function fetchMySubscriptions(): Promise<{
  data: FanSubscriptionRow[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: listMockSubscriptions(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<FanSubscriptionRow[]>('/api/me/subscriptions');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchMyPurchases(): Promise<{
  data: PurchaseRow[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: listMockPurchases(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<PurchaseRow[]>('/api/me/purchases');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

/** Cancels at the end of the current billing period — the row stays
 * ACTIVE with `canceledAt` set, not removed or flipped immediately,
 * matching the real POST /api/me/subscriptions/:id/cancel response. */
export async function cancelMySubscription(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row = mockCancelSubscription(id);
    if (!row) {
      return { ok: false, error: 'Subscription not found' };
    }
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/subscriptions/${encodeURIComponent(id)}/cancel`,
      { method: 'POST' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not cancel subscription',
    };
  }
}
