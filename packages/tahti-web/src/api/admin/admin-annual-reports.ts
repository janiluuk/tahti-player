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
