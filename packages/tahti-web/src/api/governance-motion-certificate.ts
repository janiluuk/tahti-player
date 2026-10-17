import { requestJson } from './client-request';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

export type MotionTally = { YES: number; NO: number; ABSTAIN: number };

export type MotionResultCorrection = {
  id: string;
  note: string;
  tally: MotionTally | null;
  createdAt: string;
  digest: string;
  matchesRecord: boolean;
};

/** The result certificate fixed when a motion closed. It is never rewritten;
 * the board's corrections are appended and `correctedTally` is the latest. */
export type MotionCertificate = {
  motionId: string;
  title: string;
  advisory: boolean;
  closedAt: string;
  eligibleMemberCount: number | null;
  tally: MotionTally;
  totalVotes: number;
  algorithm: 'sha256';
  digest: string;
  matchesRecord: boolean;
  corrections: MotionResultCorrection[];
  correctedTally: MotionTally | null;
};

const mockCertificates = new Map<string, MotionCertificate>();

export function mockMotionCertificate(
  motionId: string,
  title = 'Mock motion',
): MotionCertificate {
  const existing = mockCertificates.get(motionId);
  if (existing) {
    return existing;
  }
  const certificate: MotionCertificate = {
    motionId,
    title,
    advisory: true,
    closedAt: '2026-09-30T18:00:00.000Z',
    eligibleMemberCount: 42,
    tally: { YES: 18, NO: 4, ABSTAIN: 2 },
    totalVotes: 24,
    algorithm: 'sha256',
    digest: '9f2c4b7e1a0d5c3e8b6f4a2d1c0e9b8a7f6e5d4c3b2a1908f7e6d5c4b3a29180',
    matchesRecord: true,
    corrections: [],
    correctedTally: null,
  };
  mockCertificates.set(motionId, certificate);
  return certificate;
}

export function setMockMotionCertificate(certificate: MotionCertificate): void {
  mockCertificates.set(certificate.motionId, certificate);
}

/** Null when no certificate was issued (motions closed before certificates
 * existed) or the motion is not closed yet. */
export async function fetchMotionCertificate(
  motionId: string,
): Promise<{ data: MotionCertificate | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockMotionCertificate(motionId),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<MotionCertificate>(
      `/api/v1/governance/motions/${encodeURIComponent(motionId)}/certificate`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: apiErrorMeta(err) };
  }
}

/** The board appends a correction to a closed motion's result; the
 * certificate itself is never rewritten. Without a tally it is a note only. */
export async function correctMotionResult(
  motionId: string,
  input: { note: string; tally?: MotionTally },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const note = input.note.trim();
  if (!note) {
    return { ok: false, error: 'Say what the correction is about' };
  }
  if (isForceMock()) {
    const current = mockMotionCertificate(motionId);
    const total = input.tally
      ? input.tally.YES + input.tally.NO + input.tally.ABSTAIN
      : 0;
    if (
      input.tally &&
      current.eligibleMemberCount !== null &&
      total > current.eligibleMemberCount
    ) {
      return {
        ok: false,
        error: 'The corrected tally has more votes than eligible members',
      };
    }
    setMockMotionCertificate({
      ...current,
      corrections: [
        ...current.corrections,
        {
          id: `correction-${Date.now()}`,
          note,
          tally: input.tally ?? null,
          createdAt: new Date().toISOString(),
          digest: 'mock',
          matchesRecord: true,
        },
      ],
      correctedTally: input.tally ?? current.correctedTally,
    });
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/admin/governance/motions/${encodeURIComponent(motionId)}/result-corrections`,
      {
        method: 'POST',
        body: JSON.stringify({
          note,
          ...(input.tally ? { tally: input.tally } : {}),
        }),
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not save the correction',
    };
  }
}
