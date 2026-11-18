import { expect, test, type Page } from '@playwright/test';

import {
  acknowledgeGuidelines,
  signIn,
  signInAsListener,
} from './helpers/auth';

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

test('listener: adds a Spotify artist to Listen after an album link is refused', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsListener(page);
  await open(page, '/');
  await page.evaluate(() => {
    localStorage.removeItem('tahti-web-listener-widgets');
  });
  await page.reload();
  await page.getByRole('button', { name: 'Add new listen widget' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('add-listen-widget-service-spotify').click();
  await expect(
    dialog.getByRole('heading', {
      name: 'Add a playlist or artist from Spotify',
    }),
  ).toBeVisible();
  const link = dialog.getByLabel('Playlist or artist link');
  await link.fill('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy');
  await dialog.getByTestId('add-listen-widget-submit').click();
  await expect(dialog.getByRole('alert')).toHaveText(
    'This is a Spotify album link. Paste a playlist or artist link instead.',
  );
  await link.fill('https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF');
  await dialog.getByLabel('Row name').fill('Mock Artist on Spotify');
  await dialog.getByTestId('add-listen-widget-submit').click();
  await expect(dialog).toBeHidden();
  const row = page
    .getByRole('main')
    .locator('[data-widget-type="spotify"]')
    .filter({ hasText: 'Mock Artist on Spotify' });
  await expect(row.getByText('Night Drive').first()).toBeVisible();
});

test('listener: plays a station from Radio and pauses it from the player bar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsListener(page);
  await open(page, '/radio');
  await page.getByRole('button', { name: 'Play YleX' }).click();
  const pause = page.getByRole('button', { name: 'Pause YleX' });
  await expect(pause.first()).toBeVisible();
  await pause.last().click();
  await expect(page.getByRole('button', { name: 'Pause YleX' })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Play YleX' }).first(),
  ).toBeVisible();
});

test('listener: Discover → Artists narrows to one genre and opens the artist', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsListener(page);
  await open(page, '/discover?tab=artists');
  const browse = page.getByRole('region', { name: 'Browse artists' });
  await expect(browse.getByText(/^Showing 9 of 9 artists$/)).toBeVisible();
  await browse.getByRole('radio', { name: 'folk' }).click();
  await expect(browse.getByText(/^Showing 1 of 9 artists$/)).toBeVisible();
  await expect(browse.getByRole('link', { name: 'DJ Moonlight' })).toHaveCount(
    0,
  );
  await browse.getByRole('link', { name: 'Metsänpeitto' }).click();
  await expect(page).toHaveURL(/\/u\/metsanpeitto/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Metsänpeitto' }),
  ).toBeVisible();
});

test('listener on a phone: Discover → Venues shows the place and capacity, then opens the venue', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInAsListener(page);
  await open(page, '/discover?tab=venues');
  const directory = page.getByTestId('venues-directory');
  await expect(directory.getByText('Helsinki', { exact: false })).toBeVisible();
  await expect(directory.getByText('cap. 400')).toBeVisible();
  await page.getByRole('link', { name: 'Kuudes Linja' }).first().click();
  await expect(page).toHaveURL(/\/v(enues)?\/kuudes-linja/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Kuudes Linja' }),
  ).toBeVisible();
});

test('artist: switches the app to Finnish in Settings and back', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await open(page, '/settings/playback?tab=language');
  await expect(page).toHaveURL(/\/settings\/themes/);
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await settings.getByRole('button', { name: 'Language', exact: true }).click();
  await page.getByRole('option', { name: 'Suomi', exact: true }).click();
  const finnishHeading = page.getByRole('heading', {
    level: 1,
    name: 'Ulkoasu',
  });
  await expect(finnishHeading).toBeVisible();
  await page.reload();
  await acknowledgeGuidelines(page);
  await expect(finnishHeading).toBeVisible();
  await page
    .getByRole('dialog', { name: 'Asetukset' })
    .getByRole('button', { name: 'Kieli', exact: true })
    .click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Appearance' }),
  ).toBeVisible();
});
