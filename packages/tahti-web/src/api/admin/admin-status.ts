import type { FetchMeta } from '../client';
import { getJson } from '../http';
import { failMeta, isForceMock } from '../mode';

// ── Status ──────────────────────────────────────────────────────────────────

export type AdminStatusCheck = {
  state: 'up' | 'down';
  critical: boolean;
  latencyMs?: number;
  detail?: string;
};

export type AdminStatusData = {
  status: string;
  uptimeSec: number;
  checks: Record<string, AdminStatusCheck>;
  ts: string;
};

function mockStatusData(): AdminStatusData {
  return {
    status: 'operational',
    uptimeSec: 60 * 60 * 118,
    ts: new Date().toISOString(),
    checks: {
      api: { state: 'up', critical: true, latencyMs: 42 },
      postgres: { state: 'up', critical: true, latencyMs: 6 },
      icecast: { state: 'up', critical: true, latencyMs: 18 },
      minio: { state: 'up', critical: true, latencyMs: 9 },
      redis: { state: 'up', critical: false, latencyMs: 3 },
      email: {
        state: 'up',
        critical: false,
        detail: 'Postmark bounce webhook responsive',
      },
    },
  };
}

export async function fetchAdminStatus(): Promise<{
  data: AdminStatusData | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockStatusData(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminStatusData>('/api/v1/status');
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}
