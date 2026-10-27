import { expect, test, type Page } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  collectPageErrors,
  expectRouteHealthy,
  type RouteVisit,
} from './helpers/routeHealth';

type AdminVisit = RouteVisit & {
  /** The tab the page must show as selected. */
  tab?: string;
};

const ADMIN_SHELL = '[data-admin-shell]';

// Old standalone admin pages that now redirect into a tab of a merged page.
const legacyRoutes: AdminVisit[] = [
  { path: '/admin/activity', heading: /^Logs$/, url: /\/admin\/logs$/ },
  {
    path: '/admin/disco-widgets',
    heading: /^Add-ons$/,
    url: /\/admin\/addons$/,
  },
  {
    path: '/admin/beta',
    heading: /^Moderation$/,
    url: /\/admin\/moderation\/beta$/,
    tab: 'Beta applications',
  },
  {
    path: '/admin/radio-submissions',
    heading: /^Moderation$/,
    url: /\/admin\/moderation\/radio-submissions$/,
    tab: 'Radio submissions',
  },
  {
    path: '/admin/support',
    heading: /^Moderation$/,
    url: /\/admin\/moderation\/support$/,
    tab: 'Support',
  },
  {
    path: '/admin/content-reports',
    heading: /^Moderation$/,
    url: /\/admin\/moderation\/content-reports$/,
    tab: 'Content reports',
  },
  {
    path: '/admin/feature-requests',
    heading: /^Moderation$/,
    url: /\/admin\/moderation\/feature-requests$/,
    tab: 'Feature requests',
  },
  {
    path: '/admin/missed-shows',
    heading: /^Moderation$/,
    url: /\/admin\/moderation\/missed-shows$/,
    tab: 'Missed shows',
  },
  {
    path: '/admin/reports',
    heading: /^Governance$/,
    url: /\/admin\/governance\/reports$/,
    tab: 'Annual reports',
  },
  {
    path: '/admin/files',
    heading: /^Storage$/,
    url: /\/admin\/storage\?tab=files$/,
  },
  {
    path: '/admin/radio-station-suggestions',
    heading: /^Orphan pages$/,
    url: /\/admin\/orphan-pages\/radio-station-suggestions$/,
    tab: 'Radio station suggestions',
  },
];

const tabRoutes: AdminVisit[] = [
  { path: '/admin/addons', heading: /^Add-ons$/ },
  { path: '/admin/moderation/themes', heading: /^Moderation$/, tab: 'Themes' },
  { path: '/admin/governance/agm', heading: /^Governance$/, tab: 'AGM' },
  { path: '/admin/governance/board', heading: /^Governance$/, tab: 'Board' },
  {
    path: '/admin/governance/records',
    heading: /^Governance$/,
    tab: 'Records',
  },
  { path: '/admin/orphan-pages', heading: /^Orphan pages$/ },
  { path: '/admin/content', heading: /^Content$/ },
  { path: '/admin/artwork-presets', heading: /^Artwork presets$/ },
  { path: '/admin/map', heading: /^Tahti map$/ },
  { path: '/admin/venues', heading: /^Venues$/ },
];

async function signInAsBoard(page: Page): Promise<void> {
  await signIn(page);
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth') as string;
    const auth = JSON.parse(raw);
    auth.state.user.role = 'BOARD';
    auth.state.user.roles = ['BOARD', 'ARTIST'];
    auth.state.user.isBoard = true;
    localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
  });
  await page.reload();
}

async function expectAdminPage(page: Page, route: AdminVisit): Promise<void> {
  const shell = page.locator(ADMIN_SHELL).first();
  await expect(shell).toBeVisible();
  await expect(
    shell.locator('[data-admin-section-tabs]').first(),
  ).toBeVisible();
  await expect(page.getByText('Page not found')).toHaveCount(0);
  if (route.tab) {
    await expect(
      page
        .getByRole('main')
        .getByRole('tab', { name: new RegExp(`^${route.tab}`), selected: true })
        .first(),
    ).toBeVisible();
  }
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsBoard(page);
});

test('old admin bookmarks land on the tab that replaced them', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  for (const route of legacyRoutes) {
    await expectRouteHealthy(page, errors, route);
    await expectAdminPage(page, route);
  }
});

test('admin deep pages and tabs render inside the admin shell', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  for (const route of tabRoutes) {
    await expectRouteHealthy(page, errors, route);
    await expectAdminPage(page, route);
  }
});

test('a grant cycle and a storage user open from their admin lists', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await expectRouteHealthy(page, errors, {
    path: '/admin/governance/grants',
    heading: 'Disbursement history',
  });
  await page.locator('main a[href^="/admin/grants/"]').first().click();
  await expect(page).toHaveURL(/\/admin\/grants\/\d{4}$/);
  await expect(
    page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', {
      name: 'Grants',
    }),
  ).toBeVisible();
  await expectAdminPage(page, { path: '/admin/grants/$year', heading: '' });

  await expectRouteHealthy(page, errors, {
    path: '/admin/storage?tab=files',
    heading: /^Storage$/,
  });
  await page.locator('main a[href^="/admin/storage/"]').first().click();
  await expect(page).toHaveURL(/\/admin\/storage\/[^/?]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectAdminPage(page, { path: '/admin/storage/$userId', heading: '' });
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  expect(errors).toEqual([]);
});
