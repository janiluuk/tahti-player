import type {
  BoardResolution,
  GovernanceDocument,
  GovernanceMeeting,
} from '../types';

export const MOCK_GOVERNANCE_MEETINGS: GovernanceMeeting[] = [
  {
    id: 'meeting-mock-1',
    title: 'Annual general meeting 2026',
    type: 'GENERAL',
    state: 'SCHEDULED',
    scheduledAt: '2026-11-14T15:00:00.000Z',
    location: 'Kuudes Linja, Helsinki',
    remoteUrl: null,
    noticeAt: '2026-10-14T09:00:00.000Z',
    minutesKey: null,
    minutesUrl: null,
    minutesApprovedAt: null,
    eligibleMemberCount: 312,
    quorumRequired: 32,
    attendanceCount: 0,
    presentCount: 0,
    quorumMet: null,
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-14T09:00:00.000Z',
  },
  {
    id: 'meeting-mock-2',
    title: 'Board meeting, September',
    type: 'BOARD',
    state: 'APPROVED',
    scheduledAt: '2026-09-09T16:00:00.000Z',
    location: null,
    remoteUrl: null,
    noticeAt: '2026-09-02T09:00:00.000Z',
    minutesKey: 'governance/minutes/board-2026-09.pdf',
    minutesUrl: null,
    minutesApprovedAt: '2026-09-16T10:00:00.000Z',
    eligibleMemberCount: 5,
    quorumRequired: 3,
    attendanceCount: 5,
    presentCount: 4,
    quorumMet: true,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
  },
];

export const MOCK_GOVERNANCE_DOCUMENTS: GovernanceDocument[] = [
  {
    id: 'document-mock-1',
    title: 'Bylaws',
    type: 'BYLAWS',
    description: 'The cooperative rules adopted at the founding meeting.',
    version: 2,
    effectiveAt: '2026-03-01T00:00:00.000Z',
    publishedAt: '2026-03-01T00:00:00.000Z',
    meetingId: null,
    downloadUrl: null,
    externalUrl: null,
    createdAt: '2026-02-20T09:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'document-mock-2',
    title: 'Notice of the annual general meeting 2026',
    type: 'MEETING_NOTICE',
    description: null,
    version: 1,
    effectiveAt: null,
    publishedAt: null,
    meetingId: 'meeting-mock-1',
    downloadUrl: null,
    externalUrl: null,
    createdAt: '2026-10-14T09:00:00.000Z',
    updatedAt: '2026-10-14T09:00:00.000Z',
  },
];

export const MOCK_BOARD_RESOLUTIONS: BoardResolution[] = [
  {
    id: 'resolution-mock-1',
    title: 'Approve the 2026 grant formula',
    body: 'The board approves the engagement-unit formula for the 2026 grant cycle.',
    votedAt: '2026-09-09T16:40:00.000Z',
    outcome: 'PASSED',
    voteFor: 4,
    voteAgainst: 0,
    voteAbstain: 1,
    publishedAt: '2026-09-16T10:00:00.000Z',
    createdAt: '2026-09-09T17:00:00.000Z',
    createdByDisplayName: 'Rautatie',
  },
  {
    id: 'resolution-mock-2',
    title: 'Sign the distribution contract',
    body: 'Deferred until the data processing agreement is reviewed.',
    votedAt: '2026-09-09T16:55:00.000Z',
    outcome: 'DEFERRED',
    voteFor: 2,
    voteAgainst: 1,
    voteAbstain: 2,
    publishedAt: null,
    createdAt: '2026-09-09T17:05:00.000Z',
    createdByDisplayName: 'Rautatie',
  },
];

const MOCK_META = { source: 'mock', reason: 'VITE_FORCE_MOCK' } as const;

function replaceIn<T extends { id: string }>(
  list: T[],
  id: string,
  change: Partial<T>,
): T | null {
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) {
    return null;
  }
  list[index] = { ...list[index], ...change };
  return list[index];
}

export function mockCreateGovernanceMeeting(
  input: Pick<GovernanceMeeting, 'title' | 'type'> & Partial<GovernanceMeeting>,
) {
  const now = new Date().toISOString();
  const meeting: GovernanceMeeting = {
    id: `meeting-mock-${MOCK_GOVERNANCE_MEETINGS.length + 1}`,
    state: 'DRAFT',
    scheduledAt: null,
    location: null,
    remoteUrl: null,
    noticeAt: null,
    minutesKey: null,
    minutesUrl: null,
    minutesApprovedAt: null,
    eligibleMemberCount: null,
    quorumRequired: null,
    attendanceCount: 0,
    presentCount: 0,
    quorumMet: null,
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  MOCK_GOVERNANCE_MEETINGS.unshift(meeting);
  return { data: meeting, meta: MOCK_META };
}

export function mockPatchGovernanceMeeting(
  id: string,
  change: Partial<GovernanceMeeting>,
) {
  return {
    data: replaceIn(MOCK_GOVERNANCE_MEETINGS, id, {
      ...change,
      updatedAt: new Date().toISOString(),
    }),
    meta: MOCK_META,
  };
}

export function mockCreateResolution(
  input: Omit<BoardResolution, 'id' | 'publishedAt' | 'createdAt'>,
) {
  const resolution: BoardResolution = {
    id: `resolution-mock-${MOCK_BOARD_RESOLUTIONS.length + 1}`,
    publishedAt: null,
    createdAt: new Date().toISOString(),
    createdByDisplayName: 'Demo Artist',
    ...input,
  };
  MOCK_BOARD_RESOLUTIONS.unshift(resolution);
  return { data: resolution, meta: MOCK_META };
}

export function mockPatchResolution(
  id: string,
  change: Partial<BoardResolution>,
) {
  return {
    data: replaceIn(MOCK_BOARD_RESOLUTIONS, id, change),
    meta: MOCK_META,
  };
}
