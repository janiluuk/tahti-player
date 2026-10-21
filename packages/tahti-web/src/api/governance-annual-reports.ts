import { requestJson } from './client-request';
import { apiErrorMeta, isForceMock, type FetchMeta } from './mode';

export type PublishedAnnualReport = {
  year: number;
  approvedAt: string;
  publishedAt: string;
  filedAt: string | null;
  correctedAt: string | null;
  downloadUrl: string | null;
};

export function mockAnnualReports(): PublishedAnnualReport[] {
  return [
    {
      year: 2025,
      approvedAt: '2026-04-20T00:00:00.000Z',
      publishedAt: '2026-04-21T00:00:00.000Z',
      filedAt: '2026-05-02T00:00:00.000Z',
      correctedAt: null,
      downloadUrl: 'https://tahti.live/reports/annual-2025.md',
    },
    {
      year: 2024,
      approvedAt: '2025-04-18T00:00:00.000Z',
      publishedAt: '2025-04-19T00:00:00.000Z',
      filedAt: null,
      correctedAt: '2025-06-01T00:00:00.000Z',
      downloadUrl: null,
    },
  ];
}

export async function fetchAnnualReports(): Promise<{
  data: PublishedAnnualReport[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockAnnualReports(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PublishedAnnualReport[]>(
      '/api/v1/governance/annual-reports',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: apiErrorMeta(err) };
  }
}
