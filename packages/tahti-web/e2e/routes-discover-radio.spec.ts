import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  collectPageErrors,
  expectRouteHealthy,
  type RouteVisit,
} from './helpers/routeHealth';

const publicRoutes: RouteVisit[] = [
  { path: '/discover', heading: /^Discover$/ },
  { path: '/radio', heading: /^Radio$/ },
  { path: '/schedule', heading: /^Schedule$/ },
  {
    path: '/radio/show/midnight-cartography',
    heading: 'Midnight Cartography',
  },
  { path: '/search', heading: /^Search$/ },
  { path: '/search?q=night', heading: 'Results for “night”' },
  { path: '/search?tag=ambient', heading: '#ambient' },
];

test('discover, radio, schedule, show and search render for a signed-out visitor', async ({
  page,
}) => {
  const errors = collectPageErrors(page);

  for (const route of publicRoutes) {
    await expectRouteHealthy(page, errors, route);
  }
});

test('signed in, the same pages render and /themes lands on theme settings', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await signIn(page);

  for (const route of publicRoutes) {
    await expectRouteHealthy(page, errors, route);
  }
  await expectRouteHealthy(page, errors, {
    path: '/themes',
    heading: /^Themes$/,
    url: /\/settings\/themes$/,
  });
});

test('a radio show is reachable from the Radio page', async ({ page }) => {
  const errors = collectPageErrors(page);
  await expectRouteHealthy(page, errors, publicRoutes[1]!);

  await page
    .locator('a[href="/radio/show/midnight-cartography"]')
    .first()
    .click();
  await expect(page).toHaveURL(/\/radio\/show\/midnight-cartography$/);
  await expect(
    page.getByRole('heading', { name: 'Midnight Cartography' }).first(),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Episodes' })).toBeVisible();
  expect(errors).toEqual([]);
});
