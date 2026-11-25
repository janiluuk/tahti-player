import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, E2E_EMAIL, E2E_PASSWORD } from './helpers/auth';

const APP = 'https://app.tahti.live';

function isLoopback(baseURL: string | undefined): boolean {
  if (!baseURL) {
    return false;
  }
  return ['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname);
}

async function playbackState(page: Page) {
  return page.evaluate(() => {
    const audio = document.querySelector('audio');
    return {
      title:
        document.querySelector('[data-testid="now-playing-title"]')
          ?.textContent ?? null,
      paused: audio ? audio.paused : true,
      time: audio?.currentTime ?? 0,
      sameDocument:
        (window as unknown as { __keepPlaying?: boolean }).__keepPlaying ===
        true,
    };
  });
}

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test('playback keeps going from the account menu to the artist page', async ({
  page,
  baseURL,
}) => {
  // app.tahti.live (where /u/:username is the short Link page) and
  // artist.tahti.live are served from the local mock app through page.route.
  test.skip(
    !isLoopback(baseURL),
    'Requires the local mock app on localhost or 127.0.0.1',
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route(/^https:\/\/[a-z0-9-]+\.tahti\.live\//, async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({
      url: `${baseURL}${url.pathname}${url.search}`,
    });
    await route.fulfill({ response });
  });

  await page.goto(`${APP}/login`);
  await page.getByLabel('Email').fill(E2E_EMAIL);
  await page.getByLabel('Password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(
    page.getByRole('button', { name: /^Signed in as/ }),
  ).toBeVisible();

  await page.goto(`${APP}/r/night-drive`);
  await acknowledgeGuidelines(page);
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Play all' })
    .click();
  await expect(page.getByTestId('now-playing-title')).toHaveText(
    'Aurora Drift',
  );
  await expect
    .poll(async () => (await playbackState(page)).time)
    .toBeGreaterThan(0);
  await page.evaluate(() => {
    (window as unknown as { __keepPlaying?: boolean }).__keepPlaying = true;
  });

  await page.getByRole('button', { name: /^Signed in as/ }).click();
  await page.getByRole('menuitem', { name: 'My artist profile' }).click();
  await expect(page).toHaveURL(`${APP}/u/artist`);
  await expect(page.getByTestId('link-page')).toBeVisible();

  await page.getByRole('link', { name: 'Open profile' }).click();
  await expect(page).toHaveURL(`${APP}/u/artist?full=1`);
  await expect(page.getByTestId('link-page')).toHaveCount(0);

  const before = (await playbackState(page)).time;
  await expect
    .poll(async () => (await playbackState(page)).time)
    .toBeGreaterThan(before);
  const after = await playbackState(page);
  expect(after.sameDocument).toBe(true);
  expect(after.paused).toBe(false);
  expect(after.title).toBe('Aurora Drift');
});
