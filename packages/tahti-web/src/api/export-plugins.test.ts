import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./http', () => ({
  apiBase: () => 'https://api.example.test',
}));

describe('fetchExportPlugins', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns API providers when the request succeeds', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          providers: [
            {
              contractVersion: 1,
              id: 'revelator',
              name: 'Revelator',
              description: 'x',
              capabilities: { submit: true, status: true, webhook: true },
              submitPath: '/api/me/releases/:id/revelator/submit',
              statusPath: '/api/me/releases/:id/revelator',
              webhookPath: '/api/webhooks/export/revelator',
            },
          ],
        }),
      })),
    );

    const { fetchExportPlugins } = await import('./export-plugins');
    await expect(fetchExportPlugins()).resolves.toMatchObject({
      source: 'api',
      data: [{ id: 'revelator' }],
    });
  });

  it('fails closed when mock fallback is off', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 503,
      })),
    );

    const { fetchExportPlugins } = await import('./export-plugins');
    await expect(fetchExportPlugins()).rejects.toThrow(/export-plugins/);
  });

  it('uses mock fixtures only when fallback is allowed', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '1');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );

    const { fetchExportPlugins } = await import('./export-plugins');
    await expect(fetchExportPlugins()).resolves.toMatchObject({
      source: 'mock',
      data: [{ id: 'revelator' }],
    });
  });
});
