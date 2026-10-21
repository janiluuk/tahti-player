import type { FetchMeta } from '../client';
import type {
  CorrectionState,
  GovernanceCorrection,
} from '../governance-corrections';
import { getJson, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';

/** A member's correction request as the board sees it, with who asked. */
export type AdminGovernanceCorrection = GovernanceCorrection & {
  requester: {
    displayName: string;
    username: string;
    memberNumber: number | null;
  };
};

const MOCK_META = { source: 'mock', reason: 'VITE_FORCE_MOCK' } as const;

let mockQueue: AdminGovernanceCorrection[] = [
  {
    id: 'corr-open-1',
    subject: 'MEMBER_REGISTER',
    details: 'My home municipality is Espoo, not Helsinki.',
    recordKind: null,
    recordId: null,
    state: 'OPEN',
    resolutionNote: null,
    resolvedAt: null,
    createdAt: '2026-10-10T00:00:00.000Z',
    requester: {
      displayName: 'Liis Kask',
      username: 'liis-kask',
      memberNumber: 12,
    },
  },
];

export function mockCorrectionQueue(): AdminGovernanceCorrection[] {
  return mockQueue;
}

export function setMockCorrectionQueue(
  rows: AdminGovernanceCorrection[],
): void {
  mockQueue = rows;
}

/** The queue, oldest first; `state` narrows it (OPEN for waiting ones). */
export async function fetchAdminCorrections(
  state?: CorrectionState,
): Promise<{ data: AdminGovernanceCorrection[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockQueue.filter((row) => !state || row.state === state),
      meta: MOCK_META,
    };
  }
  try {
    const data = await getJson<AdminGovernanceCorrection[]>(
      `/api/admin/governance/corrections${state ? `?state=${state}` : ''}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export type CorrectionAnswer = {
  state: 'ACCEPTED' | 'REJECTED';
  resolutionNote: string;
};

/** The board's answer to a waiting request. It changes no record itself: the
 * board makes the correction where it belongs and says here what it did. */
export async function answerAdminCorrection(
  id: string,
  answer: CorrectionAnswer,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resolutionNote = answer.resolutionNote.trim();
  if (!resolutionNote) {
    return { ok: false, error: 'Tell the member what was decided' };
  }
  if (isForceMock()) {
    const row = mockQueue.find((r) => r.id === id);
    if (!row) {
      return { ok: false, error: 'Correction request not found' };
    }
    if (row.state !== 'OPEN') {
      return { ok: false, error: 'This request was already answered' };
    }
    mockQueue = mockQueue.map((r) =>
      r.id === id
        ? {
            ...r,
            state: answer.state,
            resolutionNote,
            resolvedAt: new Date().toISOString(),
          }
        : r,
    );
    return { ok: true };
  }
  try {
    await sendJson(
      `/api/admin/governance/corrections/${encodeURIComponent(id)}`,
      'PATCH',
      { state: answer.state, resolutionNote },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save the answer',
    };
  }
}
