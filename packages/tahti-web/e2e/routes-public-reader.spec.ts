import { test } from '@playwright/test';

import {
  collectPageErrors,
  expectRouteHealthy,
  type RouteVisit,
} from './helpers/routeHealth';

const readerRoutes: RouteVisit[] = [
  { path: '/subscribe/demo', heading: 'Subscribe to demo' },
  { path: '/r/dj-moonlight-release-2', heading: 'After Hours' },
  { path: '/t/northern-lights-archive-2', heading: 'Midnight Broadcast' },
  { path: '/v/kuudes-linja', heading: 'Kuudes Linja' },
];

const embedRoutes: RouteVisit[] = [
  { path: '/embed/c/demo', heading: /^demo$/ },
  { path: '/embed/r/dj-moonlight-release-2', heading: 'Mock release' },
  { path: '/embed/col/favorites-vault', heading: 'Favorites vault' },
  {
    path: '/embed/u/midnight-cartography/c/midnight-cartography-favorites-vault',
    heading: 'Favorites vault',
  },
];

const infoRoutes: RouteVisit[] = [
  { path: '/terms', heading: 'Terms of service' },
  { path: '/privacy', heading: 'Privacy policy' },
  { path: '/agpl', heading: 'Source code & AGPL licence' },
  { path: '/about', heading: 'About Tahti' },
  { path: '/how-it-works', heading: 'How Tahti works' },
  { path: '/what-is-it', heading: 'What is tahti.live' },
];

test('subscribe, release, track and venue pages render for a visitor from outside the app', async ({
  page,
}) => {
  const errors = collectPageErrors(page);

  for (const route of readerRoutes) {
    await expectRouteHealthy(page, errors, route);
  }
});

test('channel, release and collection embeds render', async ({ page }) => {
  const errors = collectPageErrors(page);

  for (const route of embedRoutes) {
    await expectRouteHealthy(page, errors, route);
  }
});

test('legal and about pages render', async ({ page }) => {
  const errors = collectPageErrors(page);

  for (const route of infoRoutes) {
    await expectRouteHealthy(page, errors, route);
  }
});
