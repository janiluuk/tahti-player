import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  collectPageErrors,
  expectRouteHealthy,
  type RouteVisit,
} from './helpers/routeHealth';

const STUDIO_NAV = '[data-studio-navigation]';

const statsRoutes: RouteVisit[] = [
  { path: '/studio/stats', heading: /^Stats$/ },
  { path: '/studio/stats?tab=plays', heading: 'Listener loyalty' },
  { path: '/studio/stats?tab=top-lists', heading: 'Content rankings' },
  { path: '/studio/insights', heading: /^Insights$/ },
  {
    path: '/studio/stats/detail',
    heading: /^Insights$/,
  },
  { path: '/studio/updates', heading: /^Posts$/ },
  { path: '/studio/updates?tab=newsletter', heading: 'Subscribers' },
  { path: '/studio/fans', heading: /^Fans$/ },
  { path: '/studio/broadcast', heading: /^Broadcast$/ },
  { path: '/studio/audience', heading: /^Earnings$/ },
  { path: '/studio/audience?tab=tiers', heading: 'Fan subscription tiers' },
  { path: '/studio/audience?tab=store', heading: 'Channel store' },
  { path: '/studio/profile', heading: /^Profile$/ },
  {
    path: '/studio/revenue',
    heading: /^Earnings$/,
    url: /\/studio\/audience$/,
  },
  {
    path: '/studio/revenue?tab=tiers',
    heading: 'Fan subscription tiers',
    url: /\/studio\/audience\?tab=tiers$/,
  },
  { path: '/studio/stripe', heading: 'Payout account' },
  { path: '/studio/distribution', heading: /^Distribution$/ },
];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
});

test('Studio stats, updates and audience pages render with Studio chrome', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  for (const route of statsRoutes) {
    await expectRouteHealthy(page, errors, route);
    await expect(page.locator(STUDIO_NAV).first()).toBeVisible();
    await expect(page.getByText('Page not found')).toHaveCount(0);
  }
});

test('Stats section chips switch sections and the Fans hub opens its pages', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await expectRouteHealthy(page, errors, statsRoutes[0]!);
  const chips = page.getByRole('radiogroup', { name: 'Stats sections' });
  await expect(chips.getByRole('radio', { name: 'Overview' })).toBeChecked();
  await chips.getByRole('radio', { name: 'Plays and listeners' }).click();
  await expect(page).toHaveURL(/\/studio\/stats\?tab=plays$/);
  await chips.getByRole('radio', { name: 'Top lists' }).click();
  await expect(page).toHaveURL(/\/studio\/stats\?tab=top-lists$/);
  await chips.getByRole('radio', { name: 'Insights' }).click();
  await expect(page).toHaveURL(/\/studio\/insights$/);

  await expectRouteHealthy(page, errors, {
    path: '/studio/fans',
    heading: /^Fans$/,
  });
  const fansTools = page.getByRole('list', { name: 'Fans tools' });
  await fansTools.getByRole('link', { name: /Newsletter/ }).click();
  await expect(page).toHaveURL(/\/studio\/updates\?tab=newsletter$/);
  await page.getByTestId('studio-fans-back').click();
  await expect(page).toHaveURL(/\/studio\/fans$/);
  await fansTools.getByRole('link', { name: /Memberships/ }).click();
  await expect(page).toHaveURL(/\/studio\/audience\?tab=tiers$/);
  await page.getByTestId('studio-fans-back').click();
  await fansTools.getByRole('link', { name: /Store/ }).click();
  await expect(page).toHaveURL(/\/studio\/audience\?tab=store$/);
  expect(errors).toEqual([]);
});

test('track insights open from a release stats tab', async ({ page }) => {
  const errors = collectPageErrors(page);
  await expectRouteHealthy(page, errors, {
    path: '/studio/releases',
    heading: 'Releases',
  });
  const release = page
    .locator('main a[href^="/studio/releases/"][href$="?tab=stats"]')
    .first();
  await release.click();
  await expect(page).toHaveURL(/\/studio\/releases\/[^/?]+\?tab=stats$/);

  const tracks = page
    .getByRole('heading', { name: 'Tracks by plays' })
    .locator('xpath=ancestor::section[1]');
  await tracks.getByRole('button').first().click();
  await expect(page).toHaveURL(/\/studio\/insights\/release-tracks\/[^/]+$/);
  await expect(
    page.getByRole('heading', { name: 'Track insights' }),
  ).toBeVisible();
  await expect(page.locator(STUDIO_NAV).first()).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  expect(errors).toEqual([]);
});
