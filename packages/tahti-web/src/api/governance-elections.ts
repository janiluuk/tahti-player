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

export type CandidacyResult = { ok: true } | { ok: false; error: string };

const MOCK_SELF = { displayName: 'Demo Member', username: 'demo' };

function candidacyPath(id: string): string {
  return `/api/v1/governance/elections/${encodeURIComponent(id)}/candidacy`;
}

function mockCandidacy(
  id: string,
  standing: boolean,
  statement?: string,
): CandidacyResult {
  const election = mockElections.find((e) => e.id === id);
  if (!election) {
    return { ok: false, error: 'Election not found' };
  }
  if (standing && !election.nominationsOpen) {
    return { ok: false, error: 'Nominations for this election are closed' };
  }
  updateMockElection(id, (e) => {
    const others = e.candidates.filter(
      (c) => c.username !== MOCK_SELF.username,
    );
    return {
      ...e,
      youAreCandidate: standing,
      candidates: standing
        ? [
            ...others,
            { ...MOCK_SELF, statement: statement ?? null, elected: false },
          ]
        : others,
    };
  });
  return { ok: true };
}

/** A member stands while nominations are open; the statement is optional. */
export async function standForElection(
  id: string,
  statement?: string,
): Promise<CandidacyResult> {
  const trimmed = statement?.trim() || undefined;
  if (isForceMock()) {
    return mockCandidacy(id, true, trimmed);
  }
  try {
    await requestJson(candidacyPath(id), {
      method: 'POST',
      body: JSON.stringify(trimmed ? { statement: trimmed } : {}),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not put you forward',
    };
  }
}

/** A candidate withdraws, until the result is recorded. */
export async function withdrawCandidacy(id: string): Promise<CandidacyResult> {
  if (isForceMock()) {
    return mockCandidacy(id, false);
  }
  try {
    await requestJson(candidacyPath(id), { method: 'DELETE' });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Could not withdraw your candidacy',
    };
  }
}
