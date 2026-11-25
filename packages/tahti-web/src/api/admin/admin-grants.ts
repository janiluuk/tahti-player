import type { FetchMeta } from '../client';
import { getJson, mutate } from '../http';
import { apiErrorMeta, failMeta, isForceMock } from '../mode';
import { mockGrantHistory, mockGrantHistoryDetail } from './admin-grants.mock';

export type AdminGrantYearSummary = {
  year: number;
  grantCount: number;
  totalCents: number;
};

export async function fetchAdminGrants(): Promise<{
  data: AdminGrantYearSummary[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockGrantHistory(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const currentYear = new Date().getUTCFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    let firstError: unknown = null;
    const results = await Promise.all(
      years.map(async (year) => {
        try {
          const data = await getJson<{
            year: number;
            grantCount: number;
            totalCents: number;
          }>(`/api/v1/transparency/grants/${year}`);
          return data.grantCount > 0 ? data : null;
        } catch (err) {
          firstError ??= err;
          return null;
        }
      }),
    );
    return {
      data: results.filter((r): r is AdminGrantYearSummary => r !== null),
      meta: firstError ? apiErrorMeta(firstError) : { source: 'api' },
    };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export type AdminGrantAnomalyCode =
  | 'DOMINANT_IP'
  | 'HIGH_UNIT_SHARE'
  | 'ANONYMOUS_GRANT'
  | 'BATCH_ACCOUNTS'
  | 'EVEN_INTERVALS'
  | 'NETWORK_CLUSTERS'
  | 'RECIPROCAL_RINGS';

export type AdminGrantAnomaly = {
  code: AdminGrantAnomalyCode;
  message: string;
};

export type AdminGrantPreviewArtist = {
  userId: string;
  username: string;
  displayName: string;
  units: number;
  amountCents: number;
  freeDownloads: number;
  paidDownloads: number;
  fanSubEuros: number;
  anomalies: AdminGrantAnomaly[];
};

export type AdminGrantPreview = {
  forYear: number;
  alreadyRun: boolean;
  poolCents: number;
  totalUnits: number;
  unallocatedCents: number;
  artists: AdminGrantPreviewArtist[];
};

export type AdminGrantHistoryDetail = AdminGrantYearSummary & {
  disbursedAt: string | null;
  grants: Array<{
    publishedAs: string | null;
    units: number;
    amountCents: string;
    state: string;
  }>;
};

function mockGrantPreview(year: number): AdminGrantPreview {
  const artists: AdminGrantPreviewArtist[] = [
    {
      userId: 'artist-1',
      username: 'northern-lights',
      displayName: 'Northern Lights',
      units: 128,
      amountCents: 64000,
      freeDownloads: 48,
      paidDownloads: 12,
      fanSubEuros: 20,
      anomalies: [
        {
          code: 'NETWORK_CLUSTERS',
          message:
            'Top 3 IP hashes are 78% of 42 counted downloads (pattern detection)',
        },
      ],
    },
    {
      userId: 'artist-2',
      username: 'kaiku-collective',
      displayName: 'Kaiku Collective',
      units: 74,
      amountCents: 37000,
      freeDownloads: 32,
      paidDownloads: 5,
      fanSubEuros: 17,
      anomalies: [],
    },
  ];
  return {
    forYear: year,
    alreadyRun: false,
    poolCents: 101000,
    totalUnits: 202,
    unallocatedCents: 0,
    artists,
  };
}

export async function fetchAdminGrantPreview(
  year: number,
): Promise<{ data: AdminGrantPreview | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockGrantPreview(year),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminGrantPreview>(
      `/api/admin/grants/preview/${year}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function fetchAdminGrantHistory(
  year: number,
): Promise<{ data: AdminGrantHistoryDetail | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockGrantHistoryDetail(year),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminGrantHistoryDetail>(
      `/api/v1/transparency/grants/${year}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function runAdminGrantCycle(
  year: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return mutate(`/api/admin/grants/run/${year}`, 'POST');
}
