import { test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  collectPageErrors,
  expectRouteHealthy,
  type RouteVisit,
} from './helpers/routeHealth';

const routes: RouteVisit[] = [
  { path: '/studio/schedule?show=parties', heading: /^Schedule$/ },
  {
    path: '/studio/listening-parties/new',
    heading: /^Schedule listening party$/,
  },
  {
    path: '/library/releases',
    heading: /^Releases$/,
    url: /\/studio\/releases$/,
  },
  { path: '/library/upload', heading: /^Upload$/ },
  { path: '/library/messages', heading: /^Messages$/, url: /\/messages$/ },
  {
    path: '/library/following',
    heading: /^Artist$/,
    url: /\/settings\/artist\?tab=following/,
  },
  { path: '/library/history', heading: /^History$/ },
  { path: '/governance/discussions', heading: /^Discussions$/ },
];

test('routes with no other e2e visit render for a signed-in artist', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = collectPageErrors(page);
  await signIn(page);
  for (const route of routes) {
    await expectRouteHealthy(page, errors, route);
  }
});
