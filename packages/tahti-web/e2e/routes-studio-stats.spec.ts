import { expect, test, type Page } from '@playwright/test';

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
  { path: '/studio/updates', heading: /^Updates$/ },
  { path: '/studio/updates?tab=newsletter', heading: 'Subscribers' },
  { path: '/studio/audience', heading: /^Audience$/ },
  { path: '/studio/audience?tab=tiers', heading: 'Fan subscription tiers' },
  {
    path: '/studio/revenue',
    heading: /^Audience$/,
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

function studioTab(page: Page, list: string, name: string) {
  return page
    .locator(STUDIO_NAV)
    .first()
    .getByRole('tablist', { name: list })
    .getByRole('tab', { name, exact: true });
}

async function selectStudioTab(
  page: Page,
  list: string,
  name: string,
  url: RegExp,
): Promise<void> {
  await studioTab(page, list, name).click();
  await expect(page).toHaveURL(url);
  await expect(studioTab(page, list, name)).toHaveAttribute(
    'aria-selected',
    'true',
  );
}

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

test('Studio section tabs switch stats, updates and audience pages', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await expectRouteHealthy(page, errors, statsRoutes[0]!);
  await expect(studioTab(page, 'Stats pages', 'Overview')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await selectStudioTab(
    page,
    'Stats pages',
    'Plays & listeners',
    /\/studio\/stats\?tab=plays$/,
  );
  await selectStudioTab(
    page,
    'Stats pages',
    'Top lists',
    /\/studio\/stats\?tab=top-lists$/,
  );

  await expectRouteHealthy(page, errors, {
    path: '/studio/updates',
    heading: /^Updates$/,
  });
  await selectStudioTab(
    page,
    'Posts pages',
    'Newsletter',
    /\/studio\/updates\?tab=newsletter$/,
  );

  await expectRouteHealthy(page, errors, {
    path: '/studio/audience',
    heading: /^Audience$/,
  });
  await selectStudioTab(
    page,
    'Audience pages',
    'Tiers',
    /\/studio\/audience\?tab=tiers$/,
  );
  await selectStudioTab(page, 'Audience pages', 'Stripe', /\/studio\/stripe$/);
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
