import { describe, expect, it } from 'vitest';

import { navigationPathname } from './navigationPathname';

describe('navigationPathname', () => {
  it('uses resolved location while a navigation is pending', () => {
    expect(
      navigationPathname({
        status: 'pending',
        location: { pathname: '/' },
        resolvedLocation: { pathname: '/radio' },
      } as Parameters<typeof navigationPathname>[0]),
    ).toBe('/radio');
  });

  it('uses the committed location when idle', () => {
    expect(
      navigationPathname({
        status: 'idle',
        location: { pathname: '/discover' },
        resolvedLocation: { pathname: '/radio' },
      } as Parameters<typeof navigationPathname>[0]),
    ).toBe('/discover');
  });
});
