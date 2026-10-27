import { expect, test, type Page } from '@playwright/test';

import { signIn } from './helpers/auth';
import { collectPageErrors, expectRouteHealthy } from './helpers/routeHealth';

// Detail pages are reached from their list pages so the journey works on
// any account with content, not only on the mock ids.

const STUDIO_NAV = '[data-studio-navigation]';
// Sounds and collections live under Library, so their pages keep the
// sidebar rather than Studio's section tabs.
const SIDEBAR = '[data-testid="sidebar-navigation"]';
const ANY_HEADING = /\S/;

async function firstHref(page: Page, selector: string): Promise<string> {
  const link = page.locator(selector).first();
  await expect(link).toBeAttached();
  return (await link.getAttribute('href')) as string;
}

async function expectLanded(
  page: Page,
  errors: string[],
  path: string,
  chrome: string,
  section?: string,
): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[?]/g, '\\?')}$`));
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(page.locator(chrome).first()).toBeVisible();
  if (section) {
    await expect(
      page.getByRole('heading', { name: section, exact: true }).first(),
    ).toBeVisible();
  }
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  await expect(page.getByText('Page not found')).toHaveCount(0);
  expect(errors, `errors logged on ${path}`).toEqual([]);
}

async function clickTo(page: Page, errors: string[], href: string) {
  errors.length = 0;
  await page.locator(`main a[href="${href}"]`).first().click();
}

async function visit(page: Page, errors: string[], path: string) {
  await expectRouteHealthy(page, errors, { path, heading: ANY_HEADING });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
});

test('a release opens from Releases, with its stats tab', async ({ page }) => {
  const errors = collectPageErrors(page);
  await expectRouteHealthy(page, errors, {
    path: '/studio/releases',
    heading: 'Releases',
  });
  const release = await firstHref(
    page,
    'main a[href^="/studio/releases/"]:not([href*="?"])',
  );

  await clickTo(page, errors, release);
  await expectLanded(page, errors, release, STUDIO_NAV, 'Tracks');

  await visit(page, errors, `${release}?tab=stats`);
  await expectLanded(
    page,
    errors,
    `${release}?tab=stats`,
    STUDIO_NAV,
    'Listener map',
  );
});

test('collection and playlist editors open from Collections', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await expectRouteHealthy(page, errors, {
    path: '/library/collections',
    heading: 'Collections',
  });
  const collection = await firstHref(
    page,
    'main a[href^="/studio/collections/"]',
  );
  const playlist = await firstHref(page, 'main a[href^="/studio/playlists/"]');

  for (const path of [collection, playlist]) {
    await visit(page, errors, path);
    await expectLanded(page, errors, path, SIDEBAR, 'Details');
  }
});

test('a sound, its editor, mastering and an editor project open from Editor', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await expectRouteHealthy(page, errors, {
    path: '/studio/editor',
    heading: 'Editor',
  });
  const project = await firstHref(page, 'main a[href^="/studio/editor/"]');
  const soundEditor = await firstHref(
    page,
    'main a[href^="/studio/sounds/"][href$="/editor"]',
  );
  const sound = soundEditor.replace(/\/editor$/, '');
  const mastering = sound.replace('/studio/sounds/', '/studio/mastering/');

  await clickTo(page, errors, project);
  await expectLanded(page, errors, project, STUDIO_NAV, 'Timeline');

  await visit(page, errors, sound);
  await expectLanded(page, errors, sound, SIDEBAR, 'Revisions');

  await clickTo(page, errors, soundEditor);
  await expectLanded(page, errors, soundEditor, SIDEBAR, 'Stems');

  await clickTo(page, errors, mastering);
  await expectLanded(page, errors, mastering, SIDEBAR, 'Reference mastering');
});

test('events: add and edit forms open from Events', async ({ page }) => {
  const errors = collectPageErrors(page);
  await expectRouteHealthy(page, errors, {
    path: '/studio/events',
    heading: 'Events',
  });
  const edit = await firstHref(
    page,
    'main a[href^="/studio/events/"][href$="/edit"]',
  );

  await clickTo(page, errors, '/studio/events/new');
  await expectLanded(
    page,
    errors,
    '/studio/events/new',
    STUDIO_NAV,
    'Add event',
  );

  await expectRouteHealthy(page, errors, { path: edit, heading: 'Edit event' });
  await expectLanded(page, errors, edit, STUDIO_NAV, 'Event details');
});

test('a show, its episodes tab and an episode review open from Shows', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await expectRouteHealthy(page, errors, {
    path: '/studio/shows',
    heading: 'Shows',
  });
  const show = await firstHref(page, 'main a[href^="/studio/shows/"]');

  await clickTo(page, errors, show);
  await expectLanded(page, errors, show, STUDIO_NAV);
  const episode = await firstHref(
    page,
    'main a[href^="/studio/shows/episodes/"]',
  );

  await visit(page, errors, `${show}?tab=episodes`);
  await expectLanded(
    page,
    errors,
    `${show}?tab=episodes`,
    STUDIO_NAV,
    'All episodes',
  );

  await visit(page, errors, show);
  await clickTo(page, errors, episode);
  await expectLanded(page, errors, episode, STUDIO_NAV, 'Public show details');
});
