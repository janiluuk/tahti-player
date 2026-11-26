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
    heading: /^Earnings$/,
    url: /\/studio\/audience\?movedFrom=money$/,
  },
  {
    path: '/settings/fan-subs',
    heading: /^Earnings$/,
    url: /\/studio\/audience\?movedFrom=fan-subs$/,
  },
  {
    path: '/settings/fan-tiers',
    heading: 'Fan subscription tiers',
    url: /\/studio\/audience\?tab=tiers&movedFrom=fan-tiers$/,
  },
  {
    path: '/settings/audience',
    heading: /^Earnings$/,
    url: /\/studio\/audience\?movedFrom=audience$/,
  },
];

// Every Settings section opens the Settings dialog on itself. Settings is
// account-only: an artist's profile, channel and broadcast forms are in Studio.
const settingsSections: RouteVisit[] = [
  { path: '/settings', heading: /^Account$/, url: /\/settings\/account$/ },
  { path: '/settings/account', heading: /^Account$/ },
  { path: '/settings/security', heading: /^Security$/ },
  { path: '/settings/notifications', heading: /^Notifications$/ },
  {
    path: '/settings/account?tab=api-tokens',
    heading: /^Security$/,
    url: /\/settings\/security/,
  },
  { path: '/settings/playback', heading: /^Playback$/ },
  {
    path: '/settings/integrations',
    heading: /^Playback$/,
    url: /\/settings\/(integrations|playback)/,
  },
  {
    path: '/settings/language',
    heading: /^General$/,
  },
  {
    path: '/settings/playback?tab=language',
    heading: /^General$/,
    url: /\/settings\/general/,
  },
  { path: '/settings/themes', heading: /^Themes$/ },
  { path: '/settings/plugin-store', heading: /^Add-ons$/ },
  { path: '/settings/whats-new', heading: /^About$/ },
  {
    path: '/settings/no-such-section',
    heading: /^Account$/,
    url: /\/settings\/account$/,
  },
  { path: '/themes', heading: /^Themes$/, url: /\/settings\/themes$/ },
];

// Studio bookmarks for pages that now live in Library, Settings or Venues, plus the Studio catalog pages.
const oldStudioBookmarks: RouteVisit[] = [
  { path: '/studio/info', heading: 'Go live', url: /\/studio\/go-live$/ },
  { path: '/studio/sounds', heading: /^Sounds$/, url: /\/studio\/sounds$/ },
  { path: '/studio/archive', heading: /^Sounds$/, url: /\/studio\/sounds$/ },
  {
    path: '/studio/recordings',
    heading: /^Recordings$/,
    url: /\/studio\/recordings$/,
  },
  {
    path: '/studio/collections',
    heading: /^Collections$/,
    url: /\/studio\/collections$/,
  },
  {
    path: '/studio/playlists',
    heading: /^Collections$/,
    url: /\/studio\/collections$/,
  },
  { path: '/studio/upload', heading: /^Upload$/, url: /\/studio\/upload$/ },
  {
    path: '/studio/stash',
    heading: /^Files$/,
    url: /\/library\/files\?kind=stash$/,
  },
  { path: '/studio/venues', heading: 'My venues', url: /\/venues\/mine$/ },
  {
    path: '/studio/setup-channel',
    heading: /^Studio$/,
    url: /\/studio$/,
  },
  {
    path: '/studio/moderation',
    heading: /^Chat$/,
    url: /\/studio\/chat$/,
  },
];

// Artist, Channel & chat and Broadcast left Settings for Studio pages; their
// bookmarks and the old Studio branding links land there.
const movedToStudio: RouteVisit[] = [
  {
    path: '/settings/artist',
    heading: /^Identity$/,
    url: /\/studio\/profile\/identity$/,
  },
  {
    path: '/settings/artist?tab=story',
    heading: /^Story$/,
    url: /\/studio\/profile\/identity#story$/,
  },
  {
    path: '/settings/channel',
    heading: /^Design$/,
    url: /\/studio\/channel\/design$/,
  },
  {
    path: '/settings/channel?tab=domain',
    heading: 'Custom domain',
    url: /\/studio\/channel\/address$/,
  },
  {
    path: '/settings/broadcast',
    heading: 'Stream Manager',
    url: /\/studio\/channel\/radio$/,
  },
  {
    path: '/settings/broadcast?tab=radio',
    heading: 'Recording defaults',
    url: /\/studio\/recordings#recording-settings$/,
  },
  {
    path: '/studio/branding',
    heading: /^Logo$/,
    url: /\/studio\/profile\/branding$/,
  },
  {
    path: '/studio/branding?tab=gallery',
    heading: /^Gallery$/,
    url: /\/studio\/profile\/gallery$/,
  },
  {
    path: '/studio/branding?tab=channel-designer',
    heading: /^Design$/,
    url: /\/studio\/channel\/design$/,
  },
];

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
  // Walks many routes in one test; each is a cold dev-server compile in CI.
  test.slow();
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

test('Artist, Channel & chat and Broadcast bookmarks land in Studio', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  for (const route of movedToStudio) {
    await expectRouteHealthy(page, errors, route);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
});
