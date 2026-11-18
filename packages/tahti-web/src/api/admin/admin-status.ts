import type { FetchMeta } from '../client';
import { apiBase } from '../http';
import { failMeta, isForceMock } from '../mode';

// ── Status ──────────────────────────────────────────────────────────────────

export type AdminStatusCheck = {
  state: 'up' | 'down' | 'skipped';
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
      'live-streams': {
        state: 'up',
        critical: true,
        latencyMs: 24,
        detail: '6 live streams fresh',
      },
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
    const res = await fetch(`${apiBase()}/api/v1/status`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    // The API answers 503 with the full body whenever a check is down, which is
    // exactly when this page needs to render it.
    if (!res.ok && res.status !== 503) {
      throw new Error(`/api/v1/status → ${res.status}`);
    }
    const data = (await res.json()) as AdminStatusData;
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}
