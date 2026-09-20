import type { FetchMeta } from '../client';
import { getJson, mutate, sendJson } from '../http';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '../mode';
import type {
  BoardResolution,
  GovernanceAttendanceItem,
  GovernanceDocument,
  GovernanceMeeting,
  GovernanceQuarterlyReport,
  UpsertGovernanceAttendance,
} from '../types';

// ── Governance ──────────────────────────────────────────────────────────────

export type AdminGovernanceOverview = {
  openMotions: number;
  pendingVenueVerifications: number;
  lastAnnualReportYear: number | null;
  boardResolutionsThisYear: number;
};

function mockGovernanceOverview(): AdminGovernanceOverview {
  return {
    openMotions: 2,
    pendingVenueVerifications: 5,
    lastAnnualReportYear: 2025,
    boardResolutionsThisYear: 7,
  };
}

export async function fetchAdminGovernanceOverview(): Promise<{
  data: AdminGovernanceOverview;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockGovernanceOverview(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminGovernanceOverview>(
      '/api/admin/governance/overview',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockGovernanceOverview(), meta: failMeta(err) };
    }
    return {
      data: {
        openMotions: 0,
        pendingVenueVerifications: 0,
        lastAnnualReportYear: null,
        boardResolutionsThisYear: 0,
      },
      meta: apiErrorMeta(err),
    };
  }
}

// ── Feature requests ────────────────────────────────────────────────────────

export type AdminFeatureRequestStatus =
  | 'OPEN'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'DECLINED'
  | 'DUPLICATE';

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

// ── Grants ──────────────────────────────────────────────────────────────────

export type AdminGrantYearSummary = {
  year: number;
  grantCount: number;
  totalCents: number;
};

function mockGrantHistory(): AdminGrantYearSummary[] {
  const year = new Date().getUTCFullYear();
  return [
    { year: year - 1, grantCount: 18, totalCents: 940000 },
    { year: year - 2, grantCount: 14, totalCents: 710000 },
  ];
}

export async function fetchAdminGrants(): Promise<{
  data: AdminGrantYearSummary[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockGrantHistory(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const currentYear = new Date().getUTCFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const results = await Promise.all(
      years.map(async (year) => {
        try {
          const data = await getJson<{
            year: number;
            grantCount: number;
            totalCents: number;
          }>(`/api/v1/transparency/grants/${year}`);
          return data.grantCount > 0 ? data : null;
        } catch {
          return null;
        }
      }),
    );
    return {
      data: results.filter((r): r is AdminGrantYearSummary => r !== null),
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export type AdminGrantPreviewArtist = {
  userId: string;
  username: string;
  displayName: string;
  units: number;
  amountCents: number;
  freeDownloads: number;
  paidDownloads: number;
  fanSubEuros: number;
};

export type AdminGrantPreview = {
  forYear: number;
  alreadyRun: boolean;
  poolCents: number;
  totalUnits: number;
  unallocatedCents: number;
  artists: AdminGrantPreviewArtist[];
};

export type AdminGrantHistoryDetail = AdminGrantYearSummary & {
  disbursedAt: string | null;
  grants: Array<{
    publishedAs: string | null;
    units: number;
    amountCents: string;
    state: string;
  }>;
};

function mockGrantPreview(year: number): AdminGrantPreview {
  const artists = [
    {
      userId: 'artist-1',
      username: 'northern-lights',
      displayName: 'Northern Lights',
      units: 128,
      amountCents: 64000,
      freeDownloads: 48,
      paidDownloads: 12,
      fanSubEuros: 20,
    },
    {
      userId: 'artist-2',
      username: 'kaiku-collective',
      displayName: 'Kaiku Collective',
      units: 74,
      amountCents: 37000,
      freeDownloads: 32,
      paidDownloads: 5,
      fanSubEuros: 17,
    },
  ];
  return {
    forYear: year,
    alreadyRun: false,
    poolCents: 101000,
    totalUnits: 202,
    unallocatedCents: 0,
    artists,
  };
}

export async function fetchAdminGrantPreview(
  year: number,
): Promise<{ data: AdminGrantPreview | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockGrantPreview(year),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminGrantPreview>(
      `/api/admin/grants/preview/${year}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function fetchAdminGrantHistory(
  year: number,
): Promise<{ data: AdminGrantHistoryDetail | null; meta: FetchMeta }> {
  try {
    const data = await getJson<AdminGrantHistoryDetail>(
      `/api/v1/transparency/grants/${year}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function runAdminGrantCycle(
  year: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return mutate(`/api/admin/grants/run/${year}`, 'POST');
}

// ── AGM ─────────────────────────────────────────────────────────────────────

export type AdminMotion = {
  id: string;
  title: string;
  state: 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
  advisory: boolean;
  openAt: string;
  closeAt: string;
  totalVotes: number;
};

function mockAgmMotions(): AdminMotion[] {
  return [
    {
      id: 'motion-1',
      title: 'Adopt updated code of conduct',
      state: 'CLOSED',
      advisory: true,
      openAt: '2026-08-10T00:00:00.000Z',
      closeAt: '2026-08-24T00:00:00.000Z',
      totalVotes: 58,
    },
    {
      id: 'motion-2',
      title: 'Raise fan-sub artist payout share to 92%',
      state: 'DRAFT',
      advisory: false,
      openAt: '2026-08-20T00:00:00.000Z',
      closeAt: '2026-09-03T00:00:00.000Z',
      totalVotes: 0,
    },
  ];
}

export async function fetchAdminAgmMotions(): Promise<{
  data: AdminMotion[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockAgmMotions(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminMotion[]>('/api/v1/governance/motions');
    return {
      data: data.filter((m) => m.state === 'OPEN' || m.state === 'DRAFT'),
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchAdminGovernanceMeetings(): Promise<{
  data: GovernanceMeeting[];
  meta: FetchMeta;
}> {
  try {
    const data = await getJson<GovernanceMeeting[]>(
      '/api/admin/governance/meetings',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createAdminGovernanceMeeting(input: {
  title: string;
  type: GovernanceMeeting['type'];
  scheduledAt?: string;
  location?: string;
  remoteUrl?: string;
  noticeAt?: string;
  eligibleMemberCount?: number;
  quorumRequired?: number;
  agenda?: Array<{ title: string; description?: string }>;
}): Promise<{ data: GovernanceMeeting | null; meta: FetchMeta }> {
  try {
    const data = await sendJson<GovernanceMeeting>(
      '/api/admin/governance/meetings',
      'POST',
      input,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function patchAdminGovernanceMeeting(
  id: string,
  input: Partial<
    Pick<
      GovernanceMeeting,
      | 'state'
      | 'scheduledAt'
      | 'location'
      | 'remoteUrl'
      | 'noticeAt'
      | 'eligibleMemberCount'
      | 'quorumRequired'
      | 'minutesKey'
      | 'minutesApprovedAt'
    >
  > & { agenda?: unknown },
): Promise<{ data: GovernanceMeeting | null; meta: FetchMeta }> {
  try {
    const data = await sendJson<GovernanceMeeting>(
      `/api/admin/governance/meetings/${encodeURIComponent(id)}`,
      'PATCH',
      input,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function uploadAdminGovernanceMinutes(
  meetingId: string,
  file: File,
): Promise<
  { ok: true; data: GovernanceMeeting } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const patched = await patchAdminGovernanceMeeting(meetingId, {
      minutesKey: `mock/governance/meetings/${meetingId}/minutes.pdf`,
    });
    if (!patched.data) {
      return { ok: false, error: 'Meeting not found' };
    }
    return { ok: true, data: patched.data };
  }
  try {
    const prep = await sendJson<{
      uploadUrl: string;
      minutesKey: string;
    }>(
      `/api/admin/governance/meetings/${encodeURIComponent(meetingId)}/minutes/prepare-upload`,
      'POST',
      {
        contentType: file.type || 'application/pdf',
        fileSizeBytes: file.size,
      },
    );
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/pdf' },
    });
    if (!put.ok) {
      return { ok: false, error: `Upload failed (${put.status})` };
    }
    const patched = await patchAdminGovernanceMeeting(meetingId, {
      minutesKey: prep.minutesKey,
    });
    if (!patched.data) {
      return { ok: false, error: 'Could not save the uploaded minutes' };
    }
    return { ok: true, data: patched.data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}

export async function fetchAdminGovernanceAttendance(
  meetingId: string,
): Promise<{ data: GovernanceAttendanceItem[]; meta: FetchMeta }> {
  try {
    const data = await getJson<GovernanceAttendanceItem[]>(
      `/api/admin/governance/meetings/${encodeURIComponent(meetingId)}/attendance`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

/** Upserts by `memberId` server-side — omitting it (manual roll-call entry
 * by name) always inserts a new row rather than updating one, since the
 * backend has no other identity to match on. */
export async function upsertAdminGovernanceAttendance(
  meetingId: string,
  input: UpsertGovernanceAttendance,
): Promise<{ data: GovernanceAttendanceItem | null; meta: FetchMeta }> {
  try {
    const data = await sendJson<GovernanceAttendanceItem>(
      `/api/admin/governance/meetings/${encodeURIComponent(meetingId)}/attendance`,
      'POST',
      input,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function fetchAdminGovernanceDocuments(): Promise<{
  data: GovernanceDocument[];
  meta: FetchMeta;
}> {
  try {
    const data = await getJson<GovernanceDocument[]>(
      '/api/admin/governance/documents',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createAdminGovernanceDocument(input: {
  title: string;
  type: GovernanceDocument['type'];
  description?: string;
  storageKey?: string;
  externalUrl?: string;
  version?: number;
  effectiveAt?: string;
  publishedAt?: string | null;
  meetingId?: string | null;
}): Promise<{ data: GovernanceDocument | null; meta: FetchMeta }> {
  try {
    const data = await sendJson<GovernanceDocument>(
      '/api/admin/governance/documents',
      'POST',
      input,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function fetchAdminResolutions(publishedOnly = false): Promise<{
  data: BoardResolution[];
  meta: FetchMeta;
}> {
  try {
    const suffix = publishedOnly ? '?publishedOnly=true' : '';
    const data = await getJson<BoardResolution[]>(
      `/api/admin/resolutions${suffix}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createAdminResolution(input: {
  title: string;
  body: string;
  votedAt: string;
  outcome: 'PASSED' | 'FAILED' | 'DEFERRED';
  voteFor: number;
  voteAgainst: number;
  voteAbstain: number;
}): Promise<{ data: BoardResolution | null; meta: FetchMeta }> {
  try {
    const data = await sendJson<BoardResolution>(
      '/api/admin/resolutions',
      'POST',
      input,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function patchAdminResolution(
  id: string,
  input: Partial<
    Pick<BoardResolution, 'title' | 'body' | 'outcome' | 'publishedAt'>
  >,
): Promise<{ data: BoardResolution | null; meta: FetchMeta }> {
  try {
    const data = await sendJson<BoardResolution>(
      `/api/admin/resolutions/${encodeURIComponent(id)}`,
      'PATCH',
      input,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export type AdminAnnualReport = {
  id: string;
  year: number;
  storageKey: string;
  generatedAt: string;
  generatedByDisplayName: string | null;
  downloadUrl: string | null;
};

export async function fetchAdminAnnualReports(): Promise<{
  data: AdminAnnualReport[];
  meta: FetchMeta;
}> {
  try {
    const data = await getJson<AdminAnnualReport[]>('/api/admin/reports');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function generateAdminAnnualReport(year: number): Promise<{
  data: AdminAnnualReport | null;
  meta: FetchMeta;
}> {
  try {
    const data = await sendJson<AdminAnnualReport>(
      `/api/admin/reports/annual/${year}`,
      'POST',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}
