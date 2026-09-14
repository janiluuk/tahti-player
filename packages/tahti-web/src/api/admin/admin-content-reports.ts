import type { FetchMeta } from '../client';
import { getJson, mutate } from '../http';
import { failMeta, isForceMock } from '../mode';

// ── Content reports ─────────────────────────────────────────────────────────

export type AdminContentReportStatus =
  | 'OPEN'
  | 'REVIEWING'
  | 'ACTIONED'
  | 'DISMISSED';

export type AdminContentReportRow = {
  id: string;
  targetType:
    | 'SOUND_ITEM'
    | 'RELEASE'
    | 'CHANNEL'
    | 'COLLECTION'
    | 'MOTION_COMMENT';
  targetId: string;
  reason: 'COPYRIGHT' | 'HARASSMENT' | 'SPAM' | 'ILLEGAL_CONTENT' | 'OTHER';
  details: string | null;
  status: AdminContentReportStatus;
  resolvedByDisplayName: string | null;
  resolutionNote: string | null;
  createdAt: string;
};

function mockContentReports(): AdminContentReportRow[] {
  return [
    {
      id: 'rep-1',
      targetType: 'SOUND_ITEM',
      targetId: 'arch-sub-1',
      reason: 'COPYRIGHT',
      details: 'Uses an unlicensed sample around 1:40.',
      status: 'OPEN',
      resolvedByDisplayName: null,
      resolutionNote: null,
      createdAt: '2026-08-15T14:00:00.000Z',
    },
    {
      id: 'rep-2',
      targetType: 'CHANNEL',
      targetId: 'kaiku-collective',
      reason: 'SPAM',
      details: null,
      status: 'REVIEWING',
      resolvedByDisplayName: null,
      resolutionNote: null,
      createdAt: '2026-08-14T11:00:00.000Z',
    },
    {
      id: 'rep-3',
      targetType: 'MOTION_COMMENT',
      targetId: 'motion-3-comment-9',
      reason: 'HARASSMENT',
      details: 'Personal attack in the comment thread.',
      status: 'ACTIONED',
      resolvedByDisplayName: 'Board — Aino',
      resolutionNote: 'Comment removed, member warned.',
      createdAt: '2026-08-10T08:00:00.000Z',
    },
  ];
}

let mockContentReportsState: AdminContentReportRow[] | null = null;

export async function fetchAdminContentReports(
  status?: AdminContentReportStatus,
): Promise<{ data: AdminContentReportRow[]; meta: FetchMeta }> {
  if (isForceMock()) {
    if (!mockContentReportsState) {
      mockContentReportsState = mockContentReports();
    }
    const data = status
      ? mockContentReportsState.filter((r) => r.status === status)
      : mockContentReportsState;
    return { data, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
  }
  try {
    const qs = new URLSearchParams({ limit: '50' });
    if (status) {
      qs.set('status', status);
    }
    const data = await getJson<{ reports: AdminContentReportRow[] }>(
      `/api/admin/content-reports?${qs.toString()}`,
    );
    return { data: data.reports, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export function resolveContentReport(
  id: string,
  status: 'REVIEWING' | 'ACTIONED' | 'DISMISSED',
  note?: string,
) {
  if (isForceMock()) {
    const row = (mockContentReportsState ?? mockContentReports()).find(
      (r) => r.id === id,
    );
    if (row) {
      row.status = status;
      row.resolutionNote = note ?? row.resolutionNote;
      row.resolvedByDisplayName = 'You';
    }
    return Promise.resolve({ ok: true } as const);
  }
  return mutate(
    `/api/admin/content-reports/${encodeURIComponent(id)}`,
    'PATCH',
    {
      status,
      resolutionNote: note,
    },
  );
}
