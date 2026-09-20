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
