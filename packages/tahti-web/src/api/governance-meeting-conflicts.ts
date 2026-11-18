import { requestJson } from './client-request';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

/** A conflict of interest as the published minutes record it. */
export type MemberConflictDeclaration = {
  id: string;
  displayName: string;
  matter: string;
  agendaItemId: string | null;
  recused: boolean;
  declaredAt: string;
};

export function mockMeetingConflicts(
  meetingId: string,
): MemberConflictDeclaration[] {
  return meetingId === 'meeting-board-2026-06'
    ? [
        {
          id: 'conflict-1',
          displayName: 'Aino Virtanen',
          matter: 'Grant application from her label',
          agendaItemId: null,
          recused: true,
          declaredAt: '2026-06-12T17:00:00.000Z',
        },
      ]
    : [];
}

/** Empty until the meeting's minutes are published. */
export async function fetchMeetingConflicts(
  meetingId: string,
): Promise<{ data: MemberConflictDeclaration[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockMeetingConflicts(meetingId),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<MemberConflictDeclaration[]>(
      `/api/v1/governance/meetings/${encodeURIComponent(meetingId)}/conflicts`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}
