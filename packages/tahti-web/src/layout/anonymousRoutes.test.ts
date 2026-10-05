import { describe, expect, it } from 'vitest';

import { isAnonymousRouteAllowed } from './anonymousRoutes';

describe('isAnonymousRouteAllowed', () => {
  it.each([
    '/',
    '/t/abc',
    '/u/liis-kask',
    '/channel/tahti-selects',
    '/c/demo-collection',
    '/radio/station/radio-helsinki',
    '/settings/themes',
    '/governance',
  ])('keeps %s open as before', (path) => {
    expect(isAnonymousRouteAllowed(path)).toBe(true);
  });

  it.each([
    '/search',
    '/newsletter/confirmed',
    '/newsletter/unsubscribed',
    '/newsletter/unsubscribe/some-token',
    '/subscribe/liis-kask',
    '/schedule',
  ])('lets a visitor open %s without a sign-in dialog', (path) => {
    expect(isAnonymousRouteAllowed(path)).toBe(true);
  });

  it.each([
    '/messages',
    '/feed',
    '/library',
    '/admin',
    '/governance/members',
    '/governance/motions/1',
    '/searching',
    '/subscriptions',
  ])('still asks for sign-in on %s', (path) => {
    expect(isAnonymousRouteAllowed(path)).toBe(false);
  });
});
