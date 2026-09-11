import type { FetchMeta } from './client';
import { apiBase } from './http';
import {
  listMockCommerceFanSubs,
  listMockCommerceTrackOrders,
} from './mock-commerce-ledger';
import {
  getMockConnectStatus,
  getMockSessionUser,
  mockCompleteConnectOnboard,
} from './mock-session';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

export type FanConnectStatus = {
  stripeConfigured: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  paymentsReady: boolean;
};

export type GrantRow = {
  forYear: number;
  units: number;
  amountCents: string;
  state: string;
  paidAt?: string | null;
};

export type GrantEstimate = {
  year: number;
  estimateCents: number;
  units: number;
  eligible: boolean;
  freeDownloads?: number;
  paidDownloads?: number;
  fanSubEuros?: number;
};

export type FanSubPayout = {
  id: string;
  state: string;
  tierName: string;
  grossCents: number;
  netToArtistCents: number;
  paidAt: string | null;
  createdAt: string;
};

export type FanPayoutStats = {
  activeSubscribers: number;
  thisMonthNetCents: number;
  paidYtdNetCents: number;
  pending: number;
  failed: number;
  paidLast30Days: number;
  recent: FanSubPayout[];
};

const emptyConnect = (): FanConnectStatus => ({
  stripeConfigured: false,
  accountId: null,
  chargesEnabled: false,
  detailsSubmitted: false,
  paymentsReady: false,
});

const mockGrants = (): GrantRow[] => [
  {
    forYear: 2025,
    units: 12,
    amountCents: '45000',
    state: 'PAID',
    paidAt: '2026-01-15T00:00:00.000Z',
  },
];

const mockEstimate = (): GrantEstimate => ({
  year: new Date().getFullYear(),
  estimateCents: 12000,
  units: 8,
  eligible: true,
  freeDownloads: 40,
  paidDownloads: 12,
  fanSubEuros: 35,
});

const mockFanPayoutStats = (): FanPayoutStats => {
  const artistUsername = getMockSessionUser()?.username;
  const ledgerSubs = listMockCommerceFanSubs().filter(
    (sub) => !artistUsername || sub.artistUsername === artistUsername,
  );
  const ledgerTracks = listMockCommerceTrackOrders().filter(
    (order) => !artistUsername || order.artistUsername === artistUsername,
  );
  const ledgerRecent = [
    ...ledgerSubs.map((sub) => ({
      id: sub.id,
      state: 'PAID' as const,
      tierName: sub.tierName,
      grossCents: sub.amountCents,
      netToArtistCents: Math.round(sub.amountCents * 0.89),
      paidAt: sub.createdAt,
      createdAt: sub.createdAt,
    })),
    ...ledgerTracks.map((order) => ({
      id: order.id,
      state: 'PAID' as const,
      tierName: `Track purchase — ${order.title}`,
      grossCents: order.amountCents,
      netToArtistCents: Math.round(order.amountCents * 0.89),
      paidAt: order.createdAt,
      createdAt: order.createdAt,
    })),
  ];
  const canned: FanPayoutStats['recent'] = [
    {
      id: 'fan-payout-mock-1',
      state: 'PAID',
      tierName: 'Supporter',
      grossCents: 500,
      netToArtistCents: 465,
      paidAt: '2026-08-20T10:00:00.000Z',
      createdAt: '2026-08-20T09:58:00.000Z',
    },
    {
      id: 'fan-payout-mock-2',
      state: 'PENDING',
      tierName: 'Patron',
      grossCents: 1500,
      netToArtistCents: 1395,
      paidAt: null,
      createdAt: '2026-08-22T14:30:00.000Z',
    },
  ];
  return {
    activeSubscribers: 26 + ledgerSubs.length,
    thisMonthNetCents:
      12840 + ledgerRecent.reduce((sum, row) => sum + row.netToArtistCents, 0),
    paidYtdNetCents: 84210,
    pending: 1,
    failed: 0,
    paidLast30Days: 8 + ledgerRecent.length,
    recent: [...ledgerRecent, ...canned],
  };
};

const emptyFanPayoutStats = (): FanPayoutStats => ({
  activeSubscribers: 0,
  thisMonthNetCents: 0,
  paidYtdNetCents: 0,
  pending: 0,
  failed: 0,
  paidLast30Days: 0,
  recent: [],
});

export const fanSubscriberExportUrl = (): string =>
  `${apiBase()}/api/me/fan-subscribers/export.csv`;

export async function fetchFanPayoutStats(): Promise<{
  data: FanPayoutStats;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockFanPayoutStats(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<Partial<FanPayoutStats>>(
      '/api/me/fan-sub-payouts',
    );
    const empty = emptyFanPayoutStats();
    return {
      data: {
        activeSubscribers: data.activeSubscribers ?? 0,
        thisMonthNetCents: data.thisMonthNetCents ?? 0,
        paidYtdNetCents: data.paidYtdNetCents ?? 0,
        pending: data.pending ?? 0,
        failed: data.failed ?? 0,
        paidLast30Days: data.paidLast30Days ?? 0,
        recent: Array.isArray(data.recent) ? data.recent : empty.recent,
      },
      meta: { source: 'api' },
    };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockFanPayoutStats(), meta: failMeta(err) };
    }
    return { data: emptyFanPayoutStats(), meta: apiErrorMeta(err) };
  }
}

export async function fetchFanConnectStatus(): Promise<{
  data: FanConnectStatus;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: getMockConnectStatus(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<FanConnectStatus>(
      '/api/me/fan-subs/connect',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: getMockConnectStatus(), meta: failMeta(err) };
    }
    return { data: emptyConnect(), meta: apiErrorMeta(err) };
  }
}

export async function startFanConnectOnboard(): Promise<
  | { ok: true; url: string }
  | { ok: true; mockActivated: true; message: string }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    const status = mockCompleteConnectOnboard();
    return {
      ok: true,
      mockActivated: true,
      message: status.paymentsReady
        ? 'Onboarding complete — payments ready.'
        : 'Onboarding updated.',
    };
  }
  try {
    const { data } = await requestJson<{
      onboardingUrl?: string;
      url?: string;
    }>('/api/me/fan-subs/connect/onboard', {
      method: 'POST',
    });
    const url = data.onboardingUrl ?? data.url;
    if (!url) {
      return { ok: false, error: 'Onboard failed' };
    }
    return { ok: true, url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Onboard failed',
    };
  }
}

export async function fetchFanConnectPortal(): Promise<
  | { ok: true; url: string }
  | { ok: true; mockActivated: true; message: string }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    const status = getMockConnectStatus();
    if (!status.accountId) {
      return {
        ok: false,
        error: 'Complete onboarding first — no payout account connected yet.',
      };
    }
    return {
      ok: true,
      mockActivated: true,
      message: `Payout portal preview for ${status.accountId} — no live redirect in this demo.`,
    };
  }
  try {
    const { data } = await requestJson<{ url: string }>(
      '/api/me/fan-subs/connect/portal',
    );
    return { ok: true, url: data.url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Portal failed',
    };
  }
}

export async function fetchMyGrants(): Promise<{
  data: GrantRow[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockGrants(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<GrantRow[]>('/api/me/grants');
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockGrants(), meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function fetchGrantEstimate(): Promise<{
  data: GrantEstimate | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockEstimate(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<GrantEstimate>(
      '/api/me/grants/estimate',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockEstimate(), meta: failMeta(err) };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}
