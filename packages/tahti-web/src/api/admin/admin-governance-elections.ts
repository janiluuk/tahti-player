import type { FetchMeta } from '../client';
import type { GovernanceBoardRole } from '../governance-board';
import { getJson, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';
import { errorText, type BoardActionResult } from './admin-governance-board';

/** An election as the board manages it (GET /api/admin/governance/elections). */
export type AdminElection = {
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
};

const MOCK_META = { source: 'mock', reason: 'VITE_FORCE_MOCK' } as const;

let mockElections: AdminElection[] = [
  {
    id: 'election-board-2027',
    title: 'Board members for 2027',
    role: 'MEMBER',
    seats: 3,
    meetingId: null,
    nominationsCloseAt: '2099-11-15T00:00:00.000Z',
    decidedAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
];

export function mockAdminElections(): AdminElection[] {
  return mockElections;
}

export function updateMockAdminElection(
  id: string,
  change: Partial<AdminElection>,
): AdminElection | undefined {
  mockElections = mockElections.map((e) =>
    e.id === id ? { ...e, ...change } : e,
  );
  return mockElections.find((e) => e.id === id);
}

export async function fetchAdminElections(): Promise<{
  data: AdminElection[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [...mockElections], meta: MOCK_META };
  }
  try {
    const data = await getJson<AdminElection[]>(
      '/api/admin/governance/elections',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export type NewElection = {
  title: string;
  role: GovernanceBoardRole;
  seats: number;
  nominationsCloseAt?: string;
};

/** Calls an election (POST /api/admin/governance/elections). There is one
 * chair, so a chair election has one seat. */
export async function createAdminElection(
  election: NewElection,
): Promise<BoardActionResult> {
  const title = election.title.trim();
  if (election.role === 'CHAIR' && election.seats !== 1) {
    return { ok: false, error: 'There is one chair' };
  }
  if (isForceMock()) {
    mockElections = [
      {
        id: `election-${Date.now()}`,
        title,
        role: election.role,
        seats: election.seats,
        meetingId: null,
        nominationsCloseAt: election.nominationsCloseAt
          ? new Date(election.nominationsCloseAt).toISOString()
          : null,
        decidedAt: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: new Date().toISOString(),
      },
      ...mockElections,
    ];
    return { ok: true };
  }
  try {
    await sendJson('/api/admin/governance/elections', 'POST', {
      title,
      role: election.role,
      seats: election.seats,
      ...(election.nominationsCloseAt
        ? { nominationsCloseAt: election.nominationsCloseAt }
        : {}),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not call the election') };
  }
}

export type ElectionChange = {
  title?: string;
  seats?: number;
  nominationsCloseAt?: string | null;
};

/** Changes an election until its result is recorded (PATCH …/elections/:id). */
export async function updateAdminElection(
  id: string,
  change: ElectionChange,
): Promise<BoardActionResult> {
  if (isForceMock()) {
    const current = mockElections.find((e) => e.id === id);
    if (!current) {
      return { ok: false, error: 'Election not found' };
    }
    if (current.decidedAt || current.cancelledAt) {
      return { ok: false, error: 'This election no longer takes changes' };
    }
    if (current.role === 'CHAIR' && change.seats && change.seats !== 1) {
      return { ok: false, error: 'There is one chair' };
    }
    updateMockAdminElection(id, {
      ...(change.title !== undefined ? { title: change.title.trim() } : {}),
      ...(change.seats !== undefined ? { seats: change.seats } : {}),
      ...(change.nominationsCloseAt !== undefined
        ? {
            nominationsCloseAt: change.nominationsCloseAt
              ? new Date(change.nominationsCloseAt).toISOString()
              : null,
          }
        : {}),
    });
    return { ok: true };
  }
  try {
    await sendJson(
      `/api/admin/governance/elections/${encodeURIComponent(id)}`,
      'PATCH',
      change,
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not save the election') };
  }
}

/** Calls an election off, with the reason members will see. */
export async function cancelAdminElection(
  id: string,
  reason: string,
): Promise<BoardActionResult> {
  const trimmed = reason.trim();
  if (isForceMock()) {
    updateMockAdminElection(id, {
      cancelledAt: new Date().toISOString(),
      cancelReason: trimmed,
    });
    return { ok: true };
  }
  try {
    await sendJson(
      `/api/admin/governance/elections/${encodeURIComponent(id)}/cancel`,
      'POST',
      { reason: trimmed },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: errorText(err, 'Could not cancel the election'),
    };
  }
}
