import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  collectPageErrors,
  expectRouteHealthy,
  type RouteVisit,
} from './helpers/routeHealth';

const listenRoutes: RouteVisit[] = [
  { path: '/listen/feed', heading: 'Your feed' },
  {
    path: '/listen/favorites',
    heading: /^Favorites$/,
    url: /\/library\/favorites$/,
  },
  { path: '/listen/history', heading: /^History$/ },
];

test('Listen feed, favorites and history render for a signed-in listener', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await signIn(page);

  for (const route of listenRoutes) {
    await expectRouteHealthy(page, errors, route);
  }
});

test('the feed links through to a release from a followed artist', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await signIn(page);
  await expectRouteHealthy(page, errors, listenRoutes[0]!);

  await page.locator('a[href^="/r/"]').first().click();
  await expect(page).toHaveURL(/\/r\/[^/]+$/);
  await expect(page.getByRole('main').first()).toBeVisible();
  await expect(page.getByRole('heading').first()).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  expect(errors).toEqual([]);
});
