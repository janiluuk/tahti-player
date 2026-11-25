import type { FetchMeta } from '../client';
import { getJson, mutate, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';
import type { GovernanceQuarterlyReport } from '../types';

export type AdminFeatureRequestStatus =
  'OPEN' | 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'DECLINED' | 'DUPLICATE';

export type AdminFeatureRequestRow = {
  id: string;
  title: string;
  description: string;
  status: AdminFeatureRequestStatus;
  proposerDisplayName: string;
  proposerUsername: string;
  voteCount: number;
  reviewNote: string | null;
  createdAt: string;
};

function mockFeatureRequests(): AdminFeatureRequestRow[] {
  return [
    {
      id: 'fr-1',
      title: 'Crossfade between archive tracks',
      description: 'Smooth transition when auto-advancing the queue.',
      status: 'OPEN',
      proposerDisplayName: 'DJ Moonlight',
      proposerUsername: 'dj-moonlight',
      voteCount: 34,
      reviewNote: null,
      createdAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'fr-2',
      title: 'Bulk-tag archive items',
      description: 'Select multiple tracks and apply a genre/tag at once.',
      status: 'PLANNED',
      proposerDisplayName: 'Northern Lights',
      proposerUsername: 'northern-lights',
      voteCount: 21,
      reviewNote: 'Slated for the next archive sprint.',
      createdAt: '2026-07-20T10:00:00.000Z',
    },
    {
      id: 'fr-3',
      title: 'Dark-mode-only theme toggle',
      description: null as unknown as string,
      status: 'DONE',
      proposerDisplayName: 'Kaiku Collective',
      proposerUsername: 'kaiku-collective',
      voteCount: 12,
      reviewNote: 'Shipped in themes settings.',
      createdAt: '2026-06-15T10:00:00.000Z',
    },
  ];
}

let mockFeatureRequestsState: AdminFeatureRequestRow[] | null = null;

export async function fetchAdminFeatureRequests(
  status?: AdminFeatureRequestStatus,
): Promise<{ data: AdminFeatureRequestRow[]; meta: FetchMeta }> {
  if (isForceMock()) {
    if (!mockFeatureRequestsState) {
      mockFeatureRequestsState = mockFeatureRequests();
    }
    const data = status
      ? mockFeatureRequestsState.filter((r) => r.status === status)
      : mockFeatureRequestsState;
    return { data, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const qs = status ? `?status=${status}` : '';
    const data = await getJson<AdminFeatureRequestRow[]>(
      `/api/admin/feature-requests${qs}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function updateFeatureRequestStatus(
  id: string,
  status: AdminFeatureRequestStatus,
  note?: string,
) {
  if (isForceMock()) {
    const row = (mockFeatureRequestsState ?? mockFeatureRequests()).find(
      (r) => r.id === id,
    );
    if (row) {
      row.status = status;
      row.reviewNote = note ?? row.reviewNote;
    }
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/feature-requests/${encodeURIComponent(id)}`,
    'PATCH',
    {
      status,
      reviewNote: note,
    },
  );
}

let mockQuarterlyReports: GovernanceQuarterlyReport[] = [];

function currentQuarter(): { year: number; quarter: number } {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    quarter: Math.floor(now.getUTCMonth() / 3) + 1,
  };
}

export async function fetchAdminFeatureRequestReports(): Promise<{
  data: GovernanceQuarterlyReport[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockQuarterlyReports,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<GovernanceQuarterlyReport[]>(
      '/api/admin/feature-requests/reports',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function generateFeatureRequestQuarterlyReport(input?: {
  year?: number;
  quarter?: number;
}): Promise<
  { ok: true; data: GovernanceQuarterlyReport } | { ok: false; error: string }
> {
  const { year, quarter } = { ...currentQuarter(), ...input };
  if (isForceMock()) {
    const existing = mockQuarterlyReports.find(
      (r) => r.year === year && r.quarter === quarter,
    );
    if (existing) {
      return { ok: false, error: `Q${quarter} ${year} was already generated` };
    }
    const report: GovernanceQuarterlyReport = {
      id: `report-${year}-${quarter}`,
      year,
      quarter,
      storageKey: `mock/feature-request-reports/${year}-Q${quarter}.md`,
      generatedAt: new Date().toISOString(),
      generatedByDisplayName: 'You',
      downloadUrl: null,
    };
    mockQuarterlyReports = [report, ...mockQuarterlyReports];
    return { ok: true, data: report };
  }
  try {
    const data = await sendJson<GovernanceQuarterlyReport>(
      '/api/admin/feature-requests/reports',
      'POST',
      input ?? {},
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not generate report',
    };
  }
}
