import { requestJson } from './client-request';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

export type CorrectionSubject = 'MEMBER_REGISTER' | 'GOVERNANCE_RECORD';
export type CorrectionState = 'OPEN' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type GovernanceCorrection = {
  id: string;
  subject: CorrectionSubject;
  details: string;
  recordKind: string | null;
  recordId: string | null;
  state: CorrectionState;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export const CORRECTION_SUBJECT_LABELS: Record<CorrectionSubject, string> = {
  MEMBER_REGISTER: 'My member register details',
  GOVERNANCE_RECORD: 'A governance record',
};

export const CORRECTION_DETAILS_MIN = 10;
export const CORRECTION_DETAILS_MAX = 5000;

let mockCorrections: GovernanceCorrection[] = [
  {
    id: 'corr-1',
    subject: 'MEMBER_REGISTER',
    details: 'My home municipality is Espoo, not Helsinki.',
    recordKind: null,
    recordId: null,
    state: 'ACCEPTED',
    resolutionNote: 'Fixed in the register.',
    resolvedAt: '2026-09-10T00:00:00.000Z',
    createdAt: '2026-09-02T00:00:00.000Z',
  },
];

export function mockGovernanceCorrections(): GovernanceCorrection[] {
  return mockCorrections;
}

export function setMockGovernanceCorrections(
  rows: GovernanceCorrection[],
): void {
  mockCorrections = rows;
}

export async function fetchMyCorrections(): Promise<{
  data: GovernanceCorrection[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockCorrections,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<GovernanceCorrection[]>(
      '/api/v1/governance/corrections',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function requestCorrection(input: {
  subject: CorrectionSubject;
  details: string;
}): Promise<
  { ok: true; data: GovernanceCorrection } | { ok: false; error: string }
> {
  const details = input.details.trim();
  if (isForceMock()) {
    const row: GovernanceCorrection = {
      id: `corr-${Date.now()}`,
      subject: input.subject,
      details,
      recordKind: null,
      recordId: null,
      state: 'OPEN',
      resolutionNote: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
    };
    mockCorrections = [row, ...mockCorrections];
    return { ok: true, data: row };
  }
  try {
    const { data } = await requestJson<GovernanceCorrection>(
      '/api/v1/governance/corrections',
      {
        method: 'POST',
        body: JSON.stringify({ subject: input.subject, details }),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not send the request',
    };
  }
}

/** Takes back a request still waiting for the board; it stays, withdrawn. */
export async function withdrawCorrection(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const row = mockCorrections.find((c) => c.id === id);
    if (!row || row.state !== 'OPEN') {
      return {
        ok: false,
        error: 'This request is no longer waiting for an answer',
      };
    }
    mockCorrections = mockCorrections.map((c) =>
      c.id === id ? { ...c, state: 'WITHDRAWN' } : c,
    );
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/v1/governance/corrections/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not withdraw the request',
    };
  }
}
