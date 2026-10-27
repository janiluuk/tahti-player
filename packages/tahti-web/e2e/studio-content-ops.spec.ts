import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  expectHealthyPage,
  firstLinkPath,
  trackPageErrors,
  visitRoute,
} from './helpers/routeJourney';

// Detail pages are reached from their list pages so the journey works on
// any account with content, not only on the mock ids.

const STUDIO_NAV = '[data-studio-navigation]';
// Sounds and collections live under Library, so their pages keep the
// sidebar rather than Studio's section tabs.
const SIDEBAR = '[data-testid="sidebar-navigation"]';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
});

test('a release opens from Releases, with its stats tab', async ({ page }) => {
  const errors = trackPageErrors(page);
  await visitRoute(page, errors, {
    path: '/studio/releases',
    heading: 'Releases',
    chrome: STUDIO_NAV,
  });

  const release = await firstLinkPath(
    page,
    'main a[href^="/studio/releases/"]:not([href*="?"])',
  );
  await page.locator(`main a[href="${release}"]`).first().click();
  await expectHealthyPage(page, errors, { path: release, chrome: STUDIO_NAV });
  await expect(page.getByRole('heading', { name: 'Tracks' })).toBeVisible();

  await visitRoute(page, errors, {
    path: `${release}?tab=stats`,
    chrome: STUDIO_NAV,
  });
  await expect(
    page.getByRole('heading', { name: 'Listener map' }),
  ).toBeVisible();
});

test('collection and playlist editors open from Collections', async ({
  page,
}) => {
  const errors = trackPageErrors(page);
  await visitRoute(page, errors, {
    path: '/library/collections',
    heading: 'Collections',
  });
  const collection = await firstLinkPath(
    page,
    'main a[href^="/studio/collections/"]',
  );
  const playlist = await firstLinkPath(
    page,
    'main a[href^="/studio/playlists/"]',
  );

  for (const path of [collection, playlist]) {
    await visitRoute(page, errors, { path, chrome: SIDEBAR });
    await expect(
      page.getByRole('heading', { name: 'Details', exact: true }),
    ).toBeVisible();
  }
});

test('a sound, its editor, mastering and an editor project open from Editor', async ({
  page,
}) => {
  const errors = trackPageErrors(page);
  await visitRoute(page, errors, {
    path: '/studio/editor',
    heading: 'Editor',
    chrome: STUDIO_NAV,
  });
  const project = await firstLinkPath(page, 'main a[href^="/studio/editor/"]');
  const soundEditor = await firstLinkPath(
    page,
    'main a[href^="/studio/sounds/"][href$="/editor"]',
  );
  const sound = soundEditor.replace(/\/editor$/, '');
  const soundId = sound.split('/').pop() as string;

  await page.locator(`main a[href="${project}"]`).first().click();
  await expectHealthyPage(page, errors, { path: project, chrome: STUDIO_NAV });
  await expect(page.getByRole('heading', { name: 'Timeline' })).toBeVisible();

  await visitRoute(page, errors, { path: sound, chrome: SIDEBAR });
  await expect(page.getByRole('heading', { name: 'Revisions' })).toBeVisible();

  await page.locator(`main a[href="${soundEditor}"]`).first().click();
  await expectHealthyPage(page, errors, {
    path: soundEditor,
    chrome: SIDEBAR,
  });
  await expect(page.getByRole('heading', { name: 'Stems' })).toBeVisible();

  await page
    .locator(`main a[href="/studio/mastering/${soundId}"]`)
    .first()
    .click();
  await expectHealthyPage(page, errors, {
    path: `/studio/mastering/${soundId}`,
    heading: 'Reference mastering',
    chrome: SIDEBAR,
  });
});

test('events: add and edit forms open from Events', async ({ page }) => {
  const errors = trackPageErrors(page);
  await visitRoute(page, errors, {
    path: '/studio/events',
    heading: 'Events',
    chrome: STUDIO_NAV,
  });
  const edit = await firstLinkPath(
    page,
    'main a[href^="/studio/events/"][href$="/edit"]',
  );

  await page.locator('main a[href="/studio/events/new"]').first().click();
  await expectHealthyPage(page, errors, {
    path: '/studio/events/new',
    heading: 'Add event',
    chrome: STUDIO_NAV,
  });

  await visitRoute(page, errors, {
    path: edit,
    heading: 'Edit event',
    chrome: STUDIO_NAV,
  });
  await expect(
    page.getByRole('heading', { name: 'Event details' }),
  ).toBeVisible();
});

test('a show, its episodes tab and an episode review open from Shows', async ({
  page,
}) => {
  const errors = trackPageErrors(page);
  await visitRoute(page, errors, {
    path: '/studio/shows',
    heading: 'Shows',
    chrome: STUDIO_NAV,
  });
  const show = await firstLinkPath(page, 'main a[href^="/studio/shows/"]');

  await page.locator(`main a[href="${show}"]`).first().click();
  await expectHealthyPage(page, errors, { path: show, chrome: STUDIO_NAV });
  const episode = await firstLinkPath(
    page,
    'main a[href^="/studio/shows/episodes/"]',
  );

  await visitRoute(page, errors, {
    path: `${show}?tab=episodes`,
    chrome: STUDIO_NAV,
  });
  await expect(
    page.getByRole('heading', { name: 'All episodes' }),
  ).toBeVisible();

  await visitRoute(page, errors, { path: show, chrome: STUDIO_NAV });
  await page.locator(`main a[href="${episode}"]`).first().click();
  await expectHealthyPage(page, errors, { path: episode, chrome: STUDIO_NAV });
  await expect(
    page.getByRole('heading', { name: 'Public show details' }),
  ).toBeVisible();
});
