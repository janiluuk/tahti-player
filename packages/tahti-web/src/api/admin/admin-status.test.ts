import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchAdminStatus } from './admin-status';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const outage = {
  status: 'outage',
  uptimeSec: 3600,
  ts: '2026-10-28T12:00:00.000Z',
  checks: {
    postgres: { state: 'up', critical: true, latencyMs: 4 },
    'live-streams': {
      state: 'down',
      critical: true,
      latencyMs: 31,
      detail: 'tahti-radio silent 8h 31m; tahti-selects no playlist',
    },
  },
};

describe('fetchAdminStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the checks when the API answers 503 during an outage', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(outage, 503));

    const result = await fetchAdminStatus();

    expect(result.meta.source).toBe('api');
    expect(result.data?.status).toBe('outage');
    expect(result.data?.checks['live-streams']).toEqual(
      outage.checks['live-streams'],
    );
  });

  it('fails on other error statuses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({}, 500));

    const result = await fetchAdminStatus();

    expect(result.data).toBeNull();
  });
});
