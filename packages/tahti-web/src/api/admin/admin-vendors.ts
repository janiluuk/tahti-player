import type { FetchMeta } from '../client';
import { getJson } from '../http';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '../mode';

// ── Vendors ─────────────────────────────────────────────────────────────────

export type AdminIntegrationStatus = {
  name: string;
  live: boolean;
  detail: string;
};

function mockIntegrationStatus(): AdminIntegrationStatus[] {
  return [
    { name: 'Mixcloud', live: true, detail: 'Sound uploads connected' },
    { name: 'Revelator', live: false, detail: 'Stub mode — API key not set' },
  ];
}

export async function fetchAdminIntegrationStatus(): Promise<{
  data: AdminIntegrationStatus[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockIntegrationStatus(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ integrations: AdminIntegrationStatus[] }>(
      '/api/admin/integrations',
    );
    return { data: data.integrations, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockIntegrationStatus(), meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}
