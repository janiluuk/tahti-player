import type { FetchMeta } from '../client';
import { getJson, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';

/** A row of GET /api/admin/reports: the generated file and where the report
 * stands (approved, published, filed with the register, corrected, held). */
export type AdminAnnualReport = {
  id: string;
  year: number;
  storageKey: string;
  generatedAt: string;
  generatedByDisplayName: string | null;
  downloadUrl: string | null;
  approvedAt: string | null;
  approvalMeetingId: string | null;
  publishedAt: string | null;
  filedAt: string | null;
  filingReference: string | null;
  correctedAt: string | null;
  archivedAt: string | null;
  legalHoldAt: string | null;
  legalHoldReason: string | null;
};

export type AnnualReportResult = { ok: true } | { ok: false; error: string };

const MOCK_META = { source: 'mock', reason: 'VITE_FORCE_MOCK' } as const;

function mockReport(year: number, generatedAt: string): AdminAnnualReport {
  return {
    id: `report-mock-${year}`,
    year,
    storageKey: `reports/annual-${year}.md`,
    generatedAt,
    generatedByDisplayName: 'Rautatie',
    downloadUrl: null,
    approvedAt: null,
    approvalMeetingId: null,
    publishedAt: null,
    filedAt: null,
    filingReference: null,
    correctedAt: null,
    archivedAt: null,
    legalHoldAt: null,
    legalHoldReason: null,
  };
}

export const MOCK_ANNUAL_REPORTS: AdminAnnualReport[] = [
  mockReport(2025, '2026-02-12T10:00:00.000Z'),
];

export function mockAnnualReport(year: number): AdminAnnualReport | undefined {
  return MOCK_ANNUAL_REPORTS.find((report) => report.year === year);
}

export function updateMockAnnualReport(
  year: number,
  change: Partial<AdminAnnualReport>,
): void {
  const index = MOCK_ANNUAL_REPORTS.findIndex((r) => r.year === year);
  if (index >= 0) {
    MOCK_ANNUAL_REPORTS[index] = { ...MOCK_ANNUAL_REPORTS[index]!, ...change };
  }
}

function errorText(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export async function fetchAdminAnnualReports(): Promise<{
  data: AdminAnnualReport[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [...MOCK_ANNUAL_REPORTS], meta: MOCK_META };
  }
  try {
    const data = await getJson<AdminAnnualReport[]>('/api/admin/reports');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

/** Assembles the year's report (POST /api/admin/reports/annual/:year). The
 * answer is the generated file, not a list row, so callers reload the list. */
export async function generateAdminAnnualReport(
  year: number,
): Promise<AnnualReportResult> {
  if (isForceMock()) {
    const existing = mockAnnualReport(year);
    if (existing?.approvedAt) {
      return {
        ok: false,
        error: 'An approved report is corrected, not regenerated',
      };
    }
    const report = mockReport(year, new Date().toISOString());
    if (existing) {
      updateMockAnnualReport(year, report);
    } else {
      MOCK_ANNUAL_REPORTS.unshift(report);
    }
    return { ok: true };
  }
  try {
    await sendJson(`/api/admin/reports/annual/${year}`, 'POST');
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: errorText(err, 'Could not generate the report'),
    };
  }
}

async function reportAction(
  year: number,
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body: unknown,
  fallback: string,
): Promise<AnnualReportResult> {
  try {
    await sendJson(`/api/admin/reports/annual/${year}${path}`, method, body);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorText(err, fallback) };
  }
}

/** Records the board's approval, optionally naming the approving meeting. */
export async function approveAnnualReport(
  year: number,
  meetingId?: string,
): Promise<AnnualReportResult> {
  if (isForceMock()) {
    const report = mockAnnualReport(year);
    if (!report) {
      return { ok: false, error: 'No report has been generated for that year' };
    }
    if (report.approvedAt) {
      return { ok: false, error: 'This report is already approved' };
    }
    updateMockAnnualReport(year, {
      approvedAt: new Date().toISOString(),
      approvalMeetingId: meetingId ?? null,
    });
    return { ok: true };
  }
  return reportAction(
    year,
    '/approve',
    'POST',
    meetingId ? { meetingId } : {},
    'Could not approve the report',
  );
}

/** Makes an approved report readable by members. */
export async function publishAnnualReport(
  year: number,
): Promise<AnnualReportResult> {
  if (isForceMock()) {
    const report = mockAnnualReport(year);
    if (!report?.approvedAt) {
      return { ok: false, error: 'Only an approved report can be published' };
    }
    if (report.publishedAt) {
      return { ok: false, error: 'This report is already published' };
    }
    updateMockAnnualReport(year, { publishedAt: new Date().toISOString() });
    return { ok: true };
  }
  return reportAction(
    year,
    '/publish',
    'POST',
    undefined,
    'Could not publish the report',
  );
}

/** Records (or with `filedAt: null` clears) when the approved report was
 * filed with the register, and the register's reference. */
export async function setAnnualReportFiling(
  year: number,
  filing: { filedAt: string | null; filingReference?: string | null },
): Promise<AnnualReportResult> {
  if (isForceMock()) {
    const report = mockAnnualReport(year);
    if (!report?.approvedAt) {
      return { ok: false, error: 'Only an approved report can be filed' };
    }
    if (filing.filedAt && filing.filedAt < report.approvedAt.slice(0, 10)) {
      return {
        ok: false,
        error: 'A report cannot be filed before it was approved',
      };
    }
    updateMockAnnualReport(year, {
      filedAt: filing.filedAt,
      filingReference: filing.filedAt ? (filing.filingReference ?? null) : null,
    });
    return { ok: true };
  }
  return reportAction(
    year,
    '/filing',
    'PUT',
    filing,
    'Could not save the filing',
  );
}

export type AnnualReportRevision = {
  id: string;
  generatedAt: string;
  replacedAt: string;
  note: string;
  downloadUrl: string | null;
};

const mockRevisions = new Map<number, AnnualReportRevision[]>();

/** Regenerates an approved report from today's records, keeping the replaced
 * version with the board's note on what changed. */
export async function correctAnnualReport(
  year: number,
  note: string,
): Promise<AnnualReportResult> {
  const trimmed = note.trim();
  if (isForceMock()) {
    const report = mockAnnualReport(year);
    if (!report?.approvedAt) {
      return {
        ok: false,
        error:
          'A report that is not approved yet is regenerated, not corrected',
      };
    }
    if (report.legalHoldAt) {
      return { ok: false, error: 'This report is on legal hold' };
    }
    const now = new Date().toISOString();
    mockRevisions.set(year, [
      {
        id: `rev-${Date.now()}`,
        generatedAt: report.generatedAt,
        replacedAt: now,
        note: trimmed,
        downloadUrl: null,
      },
      ...(mockRevisions.get(year) ?? []),
    ]);
    updateMockAnnualReport(year, { generatedAt: now, correctedAt: now });
    return { ok: true };
  }
  return reportAction(
    year,
    '/correct',
    'POST',
    { note: trimmed },
    'Could not correct the report',
  );
}

/** Versions a correction replaced, newest first. */
export async function fetchAnnualReportRevisions(
  year: number,
): Promise<{ data: AnnualReportRevision[]; meta: FetchMeta }> {
  if (isForceMock()) {
    return { data: mockRevisions.get(year) ?? [], meta: MOCK_META };
  }
  try {
    const data = await getJson<AnnualReportRevision[]>(
      `/api/admin/reports/annual/${year}/revisions`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

/** Holds a report (or with `reason: null` releases it): while held it is not
 * regenerated, corrected or archived. */
export async function setAnnualReportLegalHold(
  year: number,
  reason: string | null,
): Promise<AnnualReportResult> {
  if (isForceMock()) {
    if (!mockAnnualReport(year)) {
      return { ok: false, error: 'No report has been generated for that year' };
    }
    updateMockAnnualReport(
      year,
      reason
        ? {
            legalHoldAt: new Date().toISOString(),
            legalHoldReason: reason.trim(),
          }
        : { legalHoldAt: null, legalHoldReason: null },
    );
    return { ok: true };
  }
  return reason
    ? reportAction(
        year,
        '/legal-hold',
        'PUT',
        { reason: reason.trim() },
        'Could not hold the report',
      )
    : reportAction(
        year,
        '/legal-hold',
        'DELETE',
        undefined,
        'Could not release the hold',
      );
}
