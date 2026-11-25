import { i18n } from '@tahti-player/i18n';

import type { FetchMeta } from '../client';
import { getJson, sendJson } from '../http';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
  mockFallbackMeta,
} from '../mode';
import type {
  BoardResolution,
  GovernanceAttendanceItem,
  GovernanceDocument,
  GovernanceMeeting,
  UpsertGovernanceAttendance,
} from '../types';
import {
  mockCreateGovernanceDocument,
  mockGovernanceAttendance,
  mockUpsertGovernanceAttendance,
} from './admin-governance-records.mock';
import {
  MOCK_BOARD_RESOLUTIONS,
  MOCK_GOVERNANCE_DOCUMENTS,
  MOCK_GOVERNANCE_MEETINGS,
  mockCreateGovernanceMeeting,
  mockCreateResolution,
  mockPatchGovernanceMeeting,
  mockPatchResolution,
} from './admin-governance.mock';

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
      return { data: mockGovernanceOverview(), meta: mockFallbackMeta(err) };
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
  if (isForceMock()) {
    return {
      data: MOCK_GOVERNANCE_MEETINGS,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
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
  if (isForceMock()) {
    return mockCreateGovernanceMeeting(input);
  }
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
  if (isForceMock()) {
    return mockPatchGovernanceMeeting(id, input);
  }
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
      return { ok: false, error: i18n.t('web:batch58.meetingNotFound') };
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
      return { ok: false, error: i18n.t('web:batch58.couldNotSaveMinutes') };
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
  if (isForceMock()) {
    return mockGovernanceAttendance(meetingId);
  }
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
  if (isForceMock()) {
    return mockUpsertGovernanceAttendance(meetingId, input);
  }
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
  if (isForceMock()) {
    return {
      data: MOCK_GOVERNANCE_DOCUMENTS,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
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
  if (isForceMock()) {
    return mockCreateGovernanceDocument(input);
  }
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
  if (isForceMock()) {
    return {
      data: MOCK_BOARD_RESOLUTIONS.filter(
        (resolution) => !publishedOnly || resolution.publishedAt,
      ),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
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
  if (isForceMock()) {
    return mockCreateResolution(input);
  }
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
  if (isForceMock()) {
    return mockPatchResolution(id, input);
  }
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
