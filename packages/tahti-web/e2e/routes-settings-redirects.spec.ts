import { expect, test, type Page } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  collectPageErrors,
  expectRouteHealthy,
  type RouteVisit,
} from './helpers/routeHealth';

// Former Settings money/audience panels moved to Studio.
const movedSettings: RouteVisit[] = [
  {
    path: '/settings/money',
    heading: /^Audience$/,
    url: /\/studio\/audience$/,
  },
  {
    path: '/settings/fan-subs',
    heading: /^Audience$/,
    url: /\/studio\/audience$/,
  },
  {
    path: '/settings/fan-tiers',
    heading: 'Fan subscription tiers',
    url: /\/studio\/audience\?tab=tiers$/,
  },
  {
    path: '/settings/audience',
    heading: /^Audience$/,
    url: /\/studio\/audience$/,
  },
];

// Every Settings section opens the Settings dialog on itself.
const settingsSections: RouteVisit[] = [
  { path: '/settings', heading: /^Account$/, url: /\/settings\/account$/ },
  { path: '/settings/account', heading: /^Account$/ },
  { path: '/settings/artist', heading: /^Artist$/ },
  { path: '/settings/channel', heading: 'Channel & chat' },
  { path: '/settings/broadcast', heading: /^Broadcast$/ },
  { path: '/settings/playback', heading: /^Playback$/ },
  { path: '/settings/integrations', heading: /^Integrations$/ },
  { path: '/settings/themes', heading: /^Themes$/ },
  { path: '/settings/plugin-store', heading: /^Add-ons$/ },
  { path: '/settings/whats-new', heading: "What's new" },
  {
    path: '/settings/no-such-section',
    heading: /^Account$/,
    url: /\/settings\/account$/,
  },
  { path: '/themes', heading: /^Themes$/, url: /\/settings\/themes$/ },
];

// Old Studio bookmarks for pages that moved to Library, Settings or Venues.
const oldStudioBookmarks: RouteVisit[] = [
  { path: '/studio/info', heading: 'Go live', url: /\/studio\/go-live$/ },
  { path: '/studio/sounds', heading: /^Sounds$/, url: /\/library\/sounds$/ },
  { path: '/studio/archive', heading: /^Sounds$/, url: /\/library\/sounds$/ },
  {
    path: '/studio/recordings',
    heading: /^Recordings$/,
    url: /\/library\/recordings$/,
  },
  {
    path: '/studio/collections',
    heading: /^Collections$/,
    url: /\/library\/collections$/,
  },
  {
    path: '/studio/playlists',
    heading: /^Collections$/,
    url: /\/library\/collections$/,
  },
  { path: '/studio/upload', heading: /^Upload$/, url: /\/library\/upload$/ },
  { path: '/studio/stash', heading: /^Stash$/, url: /\/library\/stash$/ },
  { path: '/studio/venues', heading: 'My venues', url: /\/venues\/mine$/ },
  {
    path: '/studio/setup-channel',
    heading: /^Studio$/,
    url: /\/studio$/,
  },
];

// Old Studio bookmarks for pages that moved into the Settings dialog.
const oldStudioSettingsBookmarks: RouteVisit[] = [
  {
    path: '/studio/branding',
    heading: 'Artist branding',
    url: /\/settings\/artist\?tab=branding$/,
  },
  {
    path: '/studio/branding?tab=gallery',
    heading: /^Gallery$/,
    url: /\/settings\/artist\?tab=gallery$/,
  },
  {
    path: '/studio/branding?tab=channel-designer',
    heading: 'Channel & chat',
    url: /\/settings\/channel$/,
  },
  {
    path: '/studio/moderation',
    heading: 'Channel & chat',
    url: /\/settings\/channel\?tab=moderators$/,
  },
];

function selectedTab(page: Page, name: string) {
  return page
    .getByRole('dialog')
    .getByRole('tab', { name, exact: true, selected: true });
}

// The open Settings dialog hides the page behind it, `<main>` included, so
// these pages are checked through the dialog instead of `expectRouteHealthy`.
async function expectSettingsDialog(
  page: Page,
  errors: string[],
  route: RouteVisit,
): Promise<void> {
  errors.length = 0;
  await page.goto(route.path);
  await expect(page).toHaveURL(
    route.url ?? new RegExp(`${route.path.replace('?', '\\?')}$`),
  );
  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: route.heading })
      .first(),
  ).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  expect(errors, `errors logged on ${route.path}`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
});

test('Settings money and audience bookmarks land in Studio', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  for (const route of movedSettings) {
    await expectRouteHealthy(page, errors, route);
    await expect(
      page.locator('[data-studio-navigation]').first(),
    ).toBeVisible();
  }
});

test('each Settings section opens the Settings dialog on itself', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  for (const route of settingsSections) {
    await expectSettingsDialog(page, errors, route);
  }
});

test('old Studio bookmarks land on the page that replaced them', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  for (const route of oldStudioBookmarks) {
    await expectRouteHealthy(page, errors, route);
    await expect(page.getByText('Page not found')).toHaveCount(0);
  }
});

test('old Studio branding and moderation bookmarks open their Settings tab', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  for (const route of oldStudioSettingsBookmarks) {
    await expectSettingsDialog(page, errors, route);
  }
  await expect(selectedTab(page, 'Moderators')).toBeVisible();

  await expectSettingsDialog(page, errors, {
    path: '/settings/channel?tab=moderators',
    heading: 'Channel & chat',
  });
  await expect(selectedTab(page, 'Moderators')).toBeVisible();
});
