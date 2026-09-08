import { describe, expect, it } from 'vitest';

import {
  appendSearchParams,
  resolveDashboardCallbackRedirect,
} from './cutoverReturns';

describe('resolveDashboardCallbackRedirect', () => {
  it.each([
    [
      { mixcloud: 'connected' },
      '/settings/plugin-store?status=connected&category=import',
    ],
    [{ fanConnect: 'return' }, '/studio/stripe?fanConnect=return'],
    [{ fansubs: 'portal' }, '/studio/audience?fansubs=portal'],
    [{ membership: 'success' }, '/settings/account?membership=success'],
    [
      { distribution: 'success', releaseId: 'release-1' },
      '/studio/distribution?distribution=success&releaseId=release-1',
    ],
    [
      { social: 'instagram_connected' },
      '/settings/connections?social=instagram_connected',
    ],
  ])('maps %o to %s', (search, expected) => {
    expect(resolveDashboardCallbackRedirect(search)).toBe(expected);
  });

  it('ignores unrelated dashboard query parameters', () => {
    expect(resolveDashboardCallbackRedirect({ tab: 'recent' })).toBeNull();
  });
});

describe('appendSearchParams', () => {
  it('preserves callback state on legacy dashboard sub-routes', () => {
    expect(
      appendSearchParams('/settings/notifications', {
        mb: 'connected',
        ignored: undefined,
      }),
    ).toBe('/settings/notifications?mb=connected');
  });

  it('does not append object-shaped values', () => {
    expect(
      appendSearchParams('/studio', {
        unsafe: { nested: true },
      }),
    ).toBe('/studio');
  });
});
