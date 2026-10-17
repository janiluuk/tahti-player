import type { FetchMeta } from '../client';
import type { GovernanceAuditor } from '../governance-association';
import { getJson, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';

export type AuditorActionResult = { ok: true } | { ok: false; error: string };

const MOCK_META = { source: 'mock', reason: 'VITE_FORCE_MOCK' } as const;

let mockAuditors: GovernanceAuditor[] = [
  {
    id: 'aud-1',
    kind: 'OPERATIONS_INSPECTOR',
    deputy: false,
    name: 'Anna Virtanen',
    firm: null,
    termStart: '2026-01-01T00:00:00.000Z',
    termEnd: null,
    meetingId: null,
  },
];

export function mockAdminAuditors(): GovernanceAuditor[] {
  return mockAuditors;
}

function errorText(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/** Every auditor and operations inspector on record, past ones included. */
export async function fetchAdminAuditors(): Promise<{
  data: GovernanceAuditor[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [...mockAuditors], meta: MOCK_META };
  }
  try {
    const data = await getJson<GovernanceAuditor[]>(
      '/api/admin/governance/auditors',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export type NewAuditor = {
  kind: GovernanceAuditor['kind'];
  deputy: boolean;
  name: string;
  firm?: string;
  termStart: string;
  termEnd?: string;
};

export async function createAdminAuditor(
  auditor: NewAuditor,
): Promise<AuditorActionResult> {
  const name = auditor.name.trim();
  const firm = auditor.firm?.trim() || undefined;
  if (auditor.termEnd && auditor.termEnd <= auditor.termStart) {
    return { ok: false, error: 'The term must end after it starts' };
  }
  if (isForceMock()) {
    mockAuditors = [
      ...mockAuditors,
      {
        id: `aud-${Date.now()}`,
        kind: auditor.kind,
        deputy: auditor.deputy,
        name,
        firm: firm ?? null,
        termStart: new Date(auditor.termStart).toISOString(),
        termEnd: auditor.termEnd
          ? new Date(auditor.termEnd).toISOString()
          : null,
        meetingId: null,
      },
    ];
    return { ok: true };
  }
  try {
    await sendJson('/api/admin/governance/auditors', 'POST', {
      kind: auditor.kind,
      deputy: auditor.deputy,
      name,
      ...(firm ? { firm } : {}),
      termStart: auditor.termStart,
      ...(auditor.termEnd ? { termEnd: auditor.termEnd } : {}),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorText(err, 'Could not add the auditor') };
  }
}
