import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchAdminActivity,
  fetchAdminDashboard,
  fetchAdminNews,
} from './admin';

describe('fetchAdminNews', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts the production API array response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              id: 'news-1',
              headline: 'Platform update',
              summary: 'The latest changes.',
              authorName: 'Board',
              publishedAt: null,
              createdAt: '2026-08-23T00:00:00.000Z',
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const result = await fetchAdminNews();

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.headline).toBe('Platform update');
    expect(result.meta.source).toBe('api');
  });
});

describe('fetchAdminDashboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('never serves fabricated fixture KPIs on a failed request outside dev/mock mode', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    );

    const result = await fetchAdminDashboard();

    // The mock fixture (mockDashboard()) reports activeMembers: 214 -- a
    // board member must never see that as if it were real production data
    // just because one of the ~9 batched admin API calls failed.
    expect(result.data.kpis.activeMembers).toBe(0);
    expect(result.data.kpis.liveNow).toBe(0);
    expect(result.meta.source).toBe('api');
  });

  it('still falls back to the mock fixture when explicitly allowed (dev/beta review)', async () => {
    vi.stubEnv('DEV', true);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    );

    const result = await fetchAdminDashboard();

    expect(result.data.kpis.activeMembers).toBe(214);
    expect(result.meta.source).toBe('mock');
  });
});

describe('fetchAdminActivity', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests scope=all by default, not the backend's governance-only default", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ page: 1, limit: 50, total: 0, items: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    await fetchAdminActivity();

    const url = new URL(fetchMock.mock.calls[0]?.[0] as string, 'http://x');
    expect(url.searchParams.get('scope')).toBe('all');
  });

  it('lets a caller opt into the backend-default governance scope', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ page: 1, limit: 50, total: 0, items: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    await fetchAdminActivity({ scope: 'governance' });

    const url = new URL(fetchMock.mock.calls[0]?.[0] as string, 'http://x');
    expect(url.searchParams.get('scope')).toBe('governance');
  });
});
