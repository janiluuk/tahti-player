import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./http', () => ({
  apiBase: () => 'https://api.example.test',
}));

describe('fetchExportPlugins for Delivery', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('exposes revelator submit for Delivery gating from the mock catalog', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '1');
    const { fetchExportPlugins } = await import('./export-plugins');
    const result = await fetchExportPlugins();
    const revelator = result.data.find((row) => row.id === 'revelator');
    expect(result.source).toBe('mock');
    expect(revelator?.capabilities.submit).toBe(true);
    expect(revelator?.name).toBe('Revelator');
  });

  it('maps API providers into Delivery gating fields', async () => {
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          providers: [
            {
              contractVersion: 1,
              id: 'revelator',
              name: 'Revelator DSP',
              description: 'DSP',
              capabilities: { submit: false, status: true, webhook: true },
              submitPath: null,
              statusPath: '/api/me/releases/:id/revelator',
              webhookPath: '/api/webhooks/export/revelator',
            },
          ],
        }),
      }),
    );
    const { fetchExportPlugins } = await import('./export-plugins');
    const result = await fetchExportPlugins();
    expect(result.source).toBe('api');
    expect(result.data[0]?.capabilities.submit).toBe(false);
    expect(result.data[0]?.name).toBe('Revelator DSP');
  });
});
