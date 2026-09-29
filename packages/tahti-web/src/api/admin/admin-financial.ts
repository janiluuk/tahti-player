import type { FetchMeta } from '../client';
import { getJson, mutate } from '../http';
import { failMeta, isForceMock } from '../mode';

// ── Financial ───────────────────────────────────────────────────────────────

export type AdminLedgerEntry = {
  id: string;
  category: string;
  amountCents: number;
  description: string;
  createdAt: string;
};

export type AdminFinancialOverview = {
  entries: AdminLedgerEntry[];
  activeFanSubCount: number;
  mrrCents: number;
  pendingPayouts: { count: number; totalNetCents: number };
  failedPayouts: { count: number; totalNetCents: number };
};

export const LEDGER_CATEGORIES = [
  'REVENUE_SUBSCRIPTION',
  'REVENUE_DISTRIBUTION',
  'REVENUE_GRANT_INBOUND',
  'REVENUE_DONATION',
  'COST_INFRASTRUCTURE',
  'COST_DISTRIBUTION_PASSTHROUGH',
  'COST_OPERATIONS',
  'COST_SALARY',
  'COST_AUDIT',
  'COST_PROFESSIONAL_SERVICES',
  'GRANT_DISBURSEMENT',
  'RESERVE_TRANSFER',
] as const;

function mockFinancialOverview(): AdminFinancialOverview {
  return {
    entries: [
      {
        id: 'ledg-1',
        category: 'REVENUE_SUBSCRIPTION',
        amountCents: 48200,
        description: 'Fan subscriptions — July settlement',
        createdAt: '2026-08-02T09:00:00.000Z',
      },
      {
        id: 'ledg-2',
        category: 'COST_INFRASTRUCTURE',
        amountCents: -21500,
        description: 'UpCloud + fiber — August',
        createdAt: '2026-08-01T09:00:00.000Z',
      },
      {
        id: 'ledg-3',
        category: 'COST_SALARY',
        amountCents: -180000,
        description: 'Ops contractor — August',
        createdAt: '2026-08-01T09:00:00.000Z',
      },
      {
        id: 'ledg-4',
        category: 'REVENUE_DONATION',
        amountCents: 12000,
        description: 'Member donation drive',
        createdAt: '2026-07-28T09:00:00.000Z',
      },
    ],
    activeFanSubCount: 214,
    mrrCents: 482000,
    pendingPayouts: { count: 3, totalNetCents: 61200 },
    failedPayouts: { count: 1, totalNetCents: 4200 },
  };
}

let mockFinancialState: AdminFinancialOverview | null = null;

export async function fetchAdminFinancial(): Promise<{
  data: AdminFinancialOverview | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    if (!mockFinancialState) {
      mockFinancialState = mockFinancialOverview();
    }
    return {
      data: mockFinancialState,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const [ledgerRes, fansubsRes] = await Promise.all([
      getJson<AdminLedgerEntry[]>(
        `/api/admin/ledger?year=${new Date().getUTCFullYear()}`,
      ),
      getJson<{
        activeFanSubCount: number;
        mrrCents: number;
        pendingPayouts: { count: number; totalNetCents: number };
        failedPayouts: { count: number; totalNetCents: number };
      }>('/api/admin/fansubs/overview'),
    ]);
    return {
      data: { entries: ledgerRes, ...fansubsRes },
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export function createLedgerEntry(entry: {
  category: string;
  amountCents: number;
  description: string;
}) {
  if (isForceMock()) {
    const row: AdminLedgerEntry = {
      id: `ledg-${Date.now()}`,
      ...entry,
      createdAt: new Date().toISOString(),
    };
    (mockFinancialState ?? mockFinancialOverview()).entries.unshift(row);
    return Promise.resolve({ ok: true } as const);
  }
  return mutate('/api/admin/ledger', 'POST', entry);
}

export type AdminFanSubPayoutState = 'PENDING' | 'FAILED';

export type AdminFanSubPayout = {
  id: string;
  state: AdminFanSubPayoutState | 'PAID';
  artistUserId: string;
  artistDisplayName: string;
  artistUsername: string;
  subscriberDisplayName: string;
  subscriberUsername: string;
  netToArtistCents: number;
  grossCents: number;
  forPeriodStart: string;
  forPeriodEnd: string;
  stripeTransferId: string | null;
  paidAt: string | null;
  createdAt: string;
};

let mockPayoutState: AdminFanSubPayout[] | null = null;

function mockPayouts(): AdminFanSubPayout[] {
  if (!mockPayoutState) {
    const base = {
      artistUserId: 'u1',
      artistDisplayName: 'DJ Moonlight',
      artistUsername: 'dj-moonlight',
      forPeriodStart: '2026-08-01T00:00:00.000Z',
      forPeriodEnd: '2026-09-01T00:00:00.000Z',
      stripeTransferId: null,
      paidAt: null,
      createdAt: '2026-09-01T06:00:00.000Z',
    };
    mockPayoutState = [
      {
        ...base,
        id: 'payout-failed-1',
        state: 'FAILED',
        subscriberDisplayName: 'Listener One',
        subscriberUsername: 'listener-one',
        netToArtistCents: 4200,
        grossCents: 5000,
      },
      {
        ...base,
        id: 'payout-pending-1',
        state: 'PENDING',
        subscriberDisplayName: 'Northern Lights',
        subscriberUsername: 'northern-lights',
        netToArtistCents: 20400,
        grossCents: 24000,
      },
    ];
  }
  return mockPayoutState;
}

export async function fetchFanSubPayouts(
  state?: AdminFanSubPayoutState,
): Promise<{
  data: { payouts: AdminFanSubPayout[]; total: number } | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const payouts = mockPayouts().filter((row) =>
      state ? row.state === state : row.state !== 'PAID',
    );
    return {
      data: {
        payouts: payouts.map((row) => ({ ...row })),
        total: payouts.length,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const qs = new URLSearchParams({ limit: '100' });
    if (state) {
      qs.set('state', state);
    }
    const data = await getJson<{ total: number; payouts: AdminFanSubPayout[] }>(
      `/api/admin/fansubs/payouts?${qs.toString()}`,
    );
    return {
      data: { payouts: data.payouts ?? [], total: data.total ?? 0 },
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export function retryFanSubPayout(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row = mockPayouts().find((payout) => payout.id === id);
    if (!row || row.state !== 'FAILED') {
      return Promise.resolve({
        ok: false,
        error: 'Only FAILED payouts can be retried',
      });
    }
    row.state = 'PENDING';
    return Promise.resolve({ ok: true });
  }
  return mutate(
    `/api/admin/fansubs/payouts/${encodeURIComponent(id)}/retry`,
    'POST',
  );
}
