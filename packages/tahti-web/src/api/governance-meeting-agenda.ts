import { requestJson } from './client-request';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

/** An agenda item as members see it, with the records filed under it:
 * motions past draft, published resolutions and published documents.
 * `outcome` stays null until the minutes are published. */
export type MemberAgendaItem = {
  id: string;
  meetingId: string;
  position: number;
  title: string;
  description: string | null;
  outcome: string | null;
  motions: Array<{ id: string; title: string; state: 'OPEN' | 'CLOSED' }>;
  resolutions: Array<{
    id: string;
    title: string;
    outcome: 'PASSED' | 'FAILED' | 'DEFERRED';
  }>;
  documents: Array<{ id: string; title: string; type: string }>;
};

/** Mock meetings whose agenda is kept as items; the others keep their
 * free-text agenda. */
const MOCK_ITEMISED_MEETINGS = new Set(['meeting-board-2026-06']);

export function mockMeetingAgenda(meetingId: string): MemberAgendaItem[] {
  if (!MOCK_ITEMISED_MEETINGS.has(meetingId)) {
    return [];
  }
  return [
    {
      id: 'agenda-1',
      meetingId,
      position: 1,
      title: 'Opening of the meeting',
      description: null,
      outcome: null,
      motions: [],
      resolutions: [],
      documents: [],
    },
    {
      id: 'agenda-2',
      meetingId,
      position: 2,
      title: 'Annual report 2025',
      description: 'The board presents the yearly report for approval.',
      outcome: 'Approved unanimously.',
      motions: [
        { id: 'motion-1', title: 'Approve the annual report', state: 'CLOSED' },
      ],
      resolutions: [],
      documents: [
        { id: 'doc-annual', title: 'Annual report 2025', type: 'REPORT' },
      ],
    },
  ];
}

export async function fetchMeetingAgenda(
  meetingId: string,
): Promise<{ data: MemberAgendaItem[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockMeetingAgenda(meetingId),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<MemberAgendaItem[]>(
      `/api/v1/governance/meetings/${encodeURIComponent(meetingId)}/agenda-items`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}
