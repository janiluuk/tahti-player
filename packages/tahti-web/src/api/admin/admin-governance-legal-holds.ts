import type { FetchMeta } from '../client';
import { getJson } from '../http';
import { failMeta, isForceMock } from '../mode';

export type LegalHoldKind =
  'MEETING' | 'DOCUMENT' | 'RESOLUTION' | 'ANNUAL_REPORT';

/** A record under a legal hold; `id` is the record's own id (a report's year). */
export type GovernanceLegalHold = {
  kind: LegalHoldKind;
  id: string;
  title: string;
  legalHoldAt: string;
  legalHoldReason: string | null;
};

const MOCK_HOLDS: GovernanceLegalHold[] = [
  {
    kind: 'MEETING',
    id: 'meeting-mock-1',
    title: 'Annual general meeting 2026',
    legalHoldAt: '2026-09-20T00:00:00.000Z',
    legalHoldReason: 'Disputed minutes',
  },
];

/** Every held governance record, newest hold first; `kinds` narrows it. */
export async function fetchGovernanceLegalHolds(
  kinds?: LegalHoldKind[],
): Promise<{ data: GovernanceLegalHold[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: MOCK_HOLDS.filter((h) => !kinds?.length || kinds.includes(h.kind)),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<GovernanceLegalHold[]>(
      `/api/admin/governance/legal-holds${kinds?.length ? `?kind=${kinds.join(',')}` : ''}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}
