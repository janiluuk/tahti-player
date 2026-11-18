import { requestJson } from './client-request';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

export type GovernanceBoardRole =
  'CHAIR' | 'VICE_CHAIR' | 'SECRETARY' | 'TREASURER' | 'MEMBER' | 'DEPUTY';

export type BoardSeat = {
  id: string;
  role: GovernanceBoardRole;
  displayName: string;
  username: string | null;
  termStart: string;
  termEnd: string | null;
};

export const BOARD_ROLE_LABELS: Record<GovernanceBoardRole, string> = {
  CHAIR: 'Chair',
  VICE_CHAIR: 'Vice chair',
  SECRETARY: 'Secretary',
  TREASURER: 'Treasurer',
  MEMBER: 'Board member',
  DEPUTY: 'Deputy member',
};

export function mockCurrentBoard(): BoardSeat[] {
  return [
    {
      id: 'term-chair',
      role: 'CHAIR',
      displayName: 'Mart Saar',
      username: 'mart-saar',
      termStart: '2026-01-01T00:00:00.000Z',
      termEnd: '2027-12-31T00:00:00.000Z',
    },
    {
      id: 'term-treasurer',
      role: 'TREASURER',
      displayName: 'Liis Kask',
      username: 'liis-kask',
      termStart: '2026-01-01T00:00:00.000Z',
      termEnd: null,
    },
    {
      id: 'term-deputy',
      role: 'DEPUTY',
      displayName: 'Former Member',
      username: null,
      termStart: '2026-01-01T00:00:00.000Z',
      termEnd: '2026-12-31T00:00:00.000Z',
    },
  ];
}

export async function fetchCurrentBoard(): Promise<{
  data: BoardSeat[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockCurrentBoard(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<BoardSeat[]>('/api/v1/governance/board');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}
