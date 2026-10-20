import { describe, expect, it } from 'vitest';

import {
  apiErrorMeta,
  failMeta,
  mockFallbackMeta,
  withMockFallback,
} from './mode';

describe('fetch meta helpers', () => {
  it('apiErrorMeta and failMeta mark empty stand-ins as api failures', () => {
    const err = new Error('boom');
    expect(apiErrorMeta(err)).toEqual({ source: 'api', reason: 'boom' });
    expect(failMeta(err)).toEqual({ source: 'api', reason: 'boom' });
  });

  it('mockFallbackMeta keeps source mock for intentional fixtures', () => {
    expect(mockFallbackMeta(new Error('down'))).toEqual({
      source: 'mock',
      reason: 'down',
    });
  });

  it('withMockFallback returns empty + api meta when fallback is off', () => {
    const previous = import.meta.env.VITE_ALLOW_MOCK_FALLBACK;
    const force = import.meta.env.VITE_FORCE_MOCK;
    import.meta.env.VITE_ALLOW_MOCK_FALLBACK = '0';
    import.meta.env.VITE_FORCE_MOCK = '0';
    try {
      const result = withMockFallback(
        new Error('offline'),
        () => ['mock'],
        () => [],
      );
      expect(result.data).toEqual([]);
      expect(result.meta.source).toBe('api');
      expect(result.meta.reason).toBe('offline');
    } finally {
      import.meta.env.VITE_ALLOW_MOCK_FALLBACK = previous;
      import.meta.env.VITE_FORCE_MOCK = force;
    }
  });
});
