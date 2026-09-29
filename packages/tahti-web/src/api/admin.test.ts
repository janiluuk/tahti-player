import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  adminUsersExportCsvUrl,
  approveAdminAddon,
  deleteAdminAddon,
  fetchAdminActivity,
  fetchAdminAddons,
  fetchAdminDashboard,
  fetchAdminNews,
  fetchFanSubPayouts,
  publishAdminAddonVersion,
  retryFanSubPayout,
  updateAdminAddon,
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

  it('forwards topic + page to the audit query string', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ page: 2, limit: 50, total: 0, items: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    await fetchAdminActivity({ topic: 'finance', page: 2, limit: 50 });

    const url = new URL(fetchMock.mock.calls[0]?.[0] as string, 'http://x');
    expect(url.searchParams.get('topic')).toBe('finance');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('limit')).toBe('50');
  });
});

describe('fetchAdminAddons', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ../tahti-org's GET /api/admin/addons responds { widgets: [...] } (see
  // apps/api/src/routes/admin/addons.ts) — an earlier pass here assumed
  // { addons: [...] }, which would have silently produced an empty list
  // against the real backend.
  it('reads the widgets field from the real backend response shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            widgets: [
              {
                id: 'addon-1',
                slug: 'ticker',
                scope: 'LISTENER',
                status: 'APPROVED',
                name: 'Ticker',
                description: 'desc',
                authorName: 'Tahti',
                categories: ['other'],
                iconUrl: null,
                currentVersion: '1.0.0',
                bundleSizeBytes: 100,
                moderationNote: null,
                defaultConfigJson: null,
                enabledByDefault: false,
                createdAt: '2026-08-01T00:00:00.000Z',
                updatedAt: '2026-08-01T00:00:00.000Z',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const result = await fetchAdminAddons();

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.slug).toBe('ticker');
  });
});

describe('approveAdminAddon', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts to the real per-action approve endpoint, not a generic PATCH', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'addon-1',
          slug: 'ticker',
          scope: 'LISTENER',
          status: 'APPROVED',
          name: 'Ticker',
          description: 'desc',
          authorName: 'Tahti',
          categories: ['other'],
          iconUrl: null,
          currentVersion: '1.0.0',
          bundleSizeBytes: 100,
          moderationNote: null,
          defaultConfigJson: null,
          enabledByDefault: false,
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await approveAdminAddon('addon-1');

    expect(result.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/admin/addons/addon-1/approve');
    expect(init.method).toBe('POST');
  });
});

describe('publishAdminAddonVersion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  it('prepares the upload, PUTs the bundle to storage, then publishes the version', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        json({
          uploadUrl: 'https://storage.example/put?sig=1',
          bundleKey: 'widgets/ticker/1.0.1.js',
          expiresAt: '2026-09-28T00:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(
        json({ id: 'addon-1', status: 'PENDING', currentVersion: '1.0.1' }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['export default {}'], 'ticker.js', {
      type: 'text/javascript',
    });

    const result = await publishAdminAddonVersion('addon-1', {
      version: ' 1.0.1 ',
      changelog: '  Fixes  ',
      file,
    });

    expect(result.ok).toBe(true);
    const calls = fetchMock.mock.calls as Array<[string, RequestInit]>;
    expect(calls[0]![0]).toContain('/api/admin/addons/addon-1/prepare-upload');
    expect(JSON.parse(String(calls[0]![1].body))).toEqual({
      version: '1.0.1',
      fileSizeBytes: file.size,
    });
    expect(calls[1]![0]).toBe('https://storage.example/put?sig=1');
    expect(calls[1]![1].method).toBe('PUT');
    expect(calls[1]![1].body).toBe(file);
    expect(calls[2]![0]).toContain('/api/admin/addons/addon-1/publish-version');
    expect(JSON.parse(String(calls[2]![1].body))).toEqual({
      version: '1.0.1',
      changelog: 'Fixes',
    });
  });

  it('stops before publishing when the storage upload fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        json({ uploadUrl: 'https://s/put', bundleKey: 'k' }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await publishAdminAddonVersion('addon-1', {
      version: '1.0.1',
      file: new File(['x'], 'a.js'),
    });

    expect(result).toEqual({ ok: false, error: 'Upload failed (403)' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects a bad version or an oversized bundle without any request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const badVersion = await publishAdminAddonVersion('addon-1', {
      version: 'v2',
      file: new File(['x'], 'a.js'),
    });
    const tooBig = await publishAdminAddonVersion('addon-1', {
      version: '2.0.0',
      file: new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'a.js'),
    });

    expect(badVersion.ok).toBe(false);
    expect(tooBig).toEqual({ ok: false, error: 'Bundles can be at most 2 MB' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('adminUsersExportCsvUrl', () => {
  it('exports everything without filters', () => {
    expect(adminUsersExportCsvUrl({})).toBe(
      '/tahti-api/api/admin/users/export.csv',
    );
  });

  it('carries the search, role and membership filters shown in the list', () => {
    const url = new URL(
      adminUsersExportCsvUrl({
        q: ' moon ',
        role: 'ARTIST',
        isMember: 'true',
      }),
      'https://beta.tahti.live',
    );
    expect(url.pathname).toBe('/tahti-api/api/admin/users/export.csv');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      search: 'moon',
      tier: 'ARTIST',
      isBoard: 'false',
      isMember: 'true',
    });
  });

  it('exports only board members for the Board role', () => {
    expect(adminUsersExportCsvUrl({ role: 'BOARD' })).toBe(
      '/tahti-api/api/admin/users/export.csv?isBoard=true',
    );
  });
});

describe('updateAdminAddon', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PATCHes every editable field, trimmed, and leaves out an empty cover', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'addon-1', name: 'Ticker' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await updateAdminAddon('addon-1', {
      name: ' Ticker ',
      description: 'Scrolls. ',
      authorName: 'Tahti',
      categories: ['other'],
      iconUrl: '  ',
    });

    expect(result.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/admin/addons/addon-1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({
      name: 'Ticker',
      description: 'Scrolls.',
      authorName: 'Tahti',
      categories: ['other'],
    });
  });
});

describe('deleteAdminAddon', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends DELETE for the add-on and accepts the empty 204', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await deleteAdminAddon('addon-1');

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/admin/addons/addon-1');
    expect(init.method).toBe('DELETE');
  });
});

describe('fan subscription payouts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks for up to 100 payouts, filtered by state when given', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(JSON.stringify({ total: 0, payouts: [] }), {
          status: 200,
        }),
    );
    await fetchFanSubPayouts();
    await fetchFanSubPayouts('FAILED');
    expect(fetchSpy.mock.calls.map(([url]) => url)).toEqual([
      '/tahti-api/api/admin/fansubs/payouts?limit=100',
      '/tahti-api/api/admin/fansubs/payouts?limit=100&state=FAILED',
    ]);
  });

  it('posts a retry for the payout', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ ok: true, payoutId: 'p1', state: 'PENDING' }),
          { status: 200 },
        ),
      );
    await expect(retryFanSubPayout('p1')).resolves.toEqual({ ok: true });
    expect(fetchSpy.mock.calls[0]![0]).toBe(
      '/tahti-api/api/admin/fansubs/payouts/p1/retry',
    );
    expect(fetchSpy.mock.calls[0]![1]?.method).toBe('POST');
  });
});
