import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchExportPlugins } from './export-plugins';
import { allowMockFallback, isForceMock } from './mode';

vi.mock('./mode', () => ({
  isForceMock: vi.fn(() => false),
  allowMockFallback: vi.fn(() => false),
}));

vi.mock('./http', () => ({
  apiBase: () => 'https://api.example.test',
}));

describe('fetchExportPlugins', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns API providers when the request succeeds', async () => {
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
              capabilities: { submit: true, status: true, webhook: false },
              submitPath: '/api/me/releases/:id/revelator/submit',
              statusPath: '/api/me/releases/:id/revelator',
              webhookPath: '/api/webhooks/export/revelator',
            },
          ],
        }),
      })),
    );

    await expect(fetchExportPlugins()).resolves.toMatchObject({
      source: 'api',
      data: [{ id: 'revelator' }],
    });
  });

  it('fails closed when mock fallback is off', async () => {
    vi.mocked(isForceMock).mockReturnValue(false);
    vi.mocked(allowMockFallback).mockReturnValue(false);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 503,
      })),
    );

    await expect(fetchExportPlugins()).rejects.toThrow(/export-plugins/);
  });

  it('uses mock fixtures only when fallback is allowed', async () => {
    vi.mocked(isForceMock).mockReturnValue(false);
    vi.mocked(allowMockFallback).mockReturnValue(true);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );

    await expect(fetchExportPlugins()).resolves.toMatchObject({
      source: 'mock',
      data: [{ id: 'revelator' }],
    });
  });
});
