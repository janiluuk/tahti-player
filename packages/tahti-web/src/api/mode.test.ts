import { afterEach, describe, expect, it, vi } from 'vitest';

describe('fetch meta helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('apiErrorMeta and failMeta mark empty stand-ins as api failures', async () => {
    const { apiErrorMeta, failMeta } = await import('./mode');
    const err = new Error('boom');
    expect(apiErrorMeta(err)).toEqual({ source: 'api', reason: 'boom' });
    expect(failMeta(err)).toEqual({ source: 'api', reason: 'boom' });
  });

  it('mockFallbackMeta keeps source mock for intentional fixtures', async () => {
    const { mockFallbackMeta } = await import('./mode');
    expect(mockFallbackMeta(new Error('down'))).toEqual({
      source: 'mock',
      reason: 'down',
    });
  });

  it('withMockFallback returns empty + api meta when fallback is off', async () => {
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '0');
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    const { withMockFallback } = await import('./mode');
    const result = withMockFallback(
      new Error('offline'),
      () => ['mock'],
      () => [],
    );
    expect(result.data).toEqual([]);
    expect(result.meta.source).toBe('api');
    expect(result.meta.reason).toBe('offline');
  });

  it('withMockFallback ignores a null mock factory', async () => {
    vi.stubEnv('VITE_ALLOW_MOCK_FALLBACK', '1');
    vi.stubEnv('VITE_FORCE_MOCK', '0');
    const { withMockFallback } = await import('./mode');
    const result = withMockFallback(new Error('offline'), null, () => []);
    expect(result.data).toEqual([]);
    expect(result.meta.source).toBe('api');
  });
});
