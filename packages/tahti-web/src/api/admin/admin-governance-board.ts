import type { FetchMeta } from '../client';
import type { GovernanceBoardRole } from '../governance-board';
import { getJson } from '../http';
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
