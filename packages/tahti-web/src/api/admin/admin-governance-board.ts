import type { FetchMeta } from '../client';
import type { GovernanceBoardRole } from '../governance-board';
import { getJson, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';

/** A board term as the board sees it (GET /api/admin/governance/board-terms):
 * current, past and future, with why it ended. */
export type AdminBoardTerm = {
  id: string;
  userId: string | null;
  displayName: string;
  role: GovernanceBoardRole;
  termStart: string;
  termEnd: string | null;
  endReason: string | null;
  meetingId: string | null;
};

export type BoardActionResult = { ok: true } | { ok: false; error: string };

const MOCK_META = { source: 'mock', reason: 'VITE_FORCE_MOCK' } as const;

let mockTerms: AdminBoardTerm[] = [
  {
    id: 'term-chair',
    userId: 'u1',
    displayName: 'Mart Saar',
    role: 'CHAIR',
    termStart: '2026-01-01T00:00:00.000Z',
    termEnd: null,
    endReason: null,
    meetingId: null,
  },
  {
    id: 'term-old-secretary',
    userId: null,
    displayName: 'Former Member',
    role: 'SECRETARY',
    termStart: '2024-01-01T00:00:00.000Z',
    termEnd: '2025-06-30T00:00:00.000Z',
    endReason: 'Resigned',
    meetingId: null,
  },
];

export function mockBoardTerms(): AdminBoardTerm[] {
  return mockTerms;
}

export function setMockBoardTerms(terms: AdminBoardTerm[]): void {
  mockTerms = terms;
}

export function errorText(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export async function fetchAdminBoardTerms(): Promise<{
  data: AdminBoardTerm[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [...mockTerms], meta: MOCK_META };
  }
  try {
    const data = await getJson<AdminBoardTerm[]>(
      '/api/admin/governance/board-terms',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export type NewBoardTerm = {
  userId: string;
  displayName: string;
  role: GovernanceBoardRole;
  termStart: string;
  termEnd?: string;
};

/** Records a member's board term (POST /api/admin/governance/board-terms). */
export async function createAdminBoardTerm(
  term: NewBoardTerm,
): Promise<BoardActionResult> {
  if (term.termEnd && term.termEnd <= term.termStart) {
    return { ok: false, error: 'The term must end after it starts' };
  }
  if (isForceMock()) {
    mockTerms = [
      {
        id: `term-${Date.now()}`,
        userId: term.userId,
        displayName: term.displayName,
        role: term.role,
        termStart: new Date(term.termStart).toISOString(),
        termEnd: term.termEnd ? new Date(term.termEnd).toISOString() : null,
        endReason: null,
        meetingId: null,
      },
      ...mockTerms,
    ];
    return { ok: true };
  }
  try {
    await sendJson('/api/admin/governance/board-terms', 'POST', {
      userId: term.userId,
      role: term.role,
      termStart: term.termStart,
      ...(term.termEnd ? { termEnd: term.termEnd } : {}),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not add the term') };
  }
}
