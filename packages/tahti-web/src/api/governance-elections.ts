import { requestJson } from './client-request';
import type { GovernanceBoardRole } from './governance-board';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

export type ElectionCandidate = {
  displayName: string;
  username: string | null;
  statement: string | null;
  elected: boolean;
};

export type GovernanceElection = {
  id: string;
  title: string;
  role: GovernanceBoardRole;
  seats: number;
  meetingId: string | null;
  nominationsCloseAt: string | null;
  decidedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  nominationsOpen: boolean;
  candidates: ElectionCandidate[];
  youAreCandidate: boolean;
};

const DAY = 24 * 60 * 60 * 1000;

let mockElections: GovernanceElection[] = [
  {
    id: 'election-board-2027',
    title: 'Board members for 2027',
    role: 'MEMBER',
    seats: 3,
    meetingId: null,
    nominationsCloseAt: new Date(Date.now() + 14 * DAY).toISOString(),
    decidedAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    nominationsOpen: true,
    candidates: [
      {
        displayName: 'Liis Kask',
        username: 'liis-kask',
        statement: 'I want the grant round to open twice a year.',
        elected: false,
      },
    ],
    youAreCandidate: false,
  },
  {
    id: 'election-chair-2026',
    title: 'Chair for 2026',
    role: 'CHAIR',
    seats: 1,
    meetingId: null,
    nominationsCloseAt: '2025-11-15T00:00:00.000Z',
    decidedAt: '2025-12-01T00:00:00.000Z',
    cancelledAt: null,
    cancelReason: null,
    createdAt: '2025-10-01T00:00:00.000Z',
    nominationsOpen: false,
    candidates: [
      {
        displayName: 'Mart Saar',
        username: 'mart-saar',
        statement: null,
        elected: true,
      },
    ],
    youAreCandidate: false,
  },
];

export function mockGovernanceElections(): GovernanceElection[] {
  return mockElections;
}

export function updateMockElection(
  id: string,
  update: (election: GovernanceElection) => GovernanceElection,
): GovernanceElection | undefined {
  mockElections = mockElections.map((e) => (e.id === id ? update(e) : e));
  return mockElections.find((e) => e.id === id);
}

export async function fetchGovernanceElections(): Promise<{
  data: GovernanceElection[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockGovernanceElections(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<GovernanceElection[]>(
      '/api/v1/governance/elections',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}
