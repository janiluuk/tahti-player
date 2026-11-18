import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signIn } from './helpers/auth';

const main = (page: Page) => page.getByRole('main');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test('artist: a PDF renamed to .mp3 is refused before it uploads', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/upload');
  await acknowledgeGuidelines(page);
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({
      name: 'not-a-song.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('%PDF-1.7\n1 0 obj\n'),
    });
  await main(page).getByRole('button', { name: 'Upload file' }).click();
  await expect(main(page).getByRole('alert')).toContainText(
    'This file is not an audio file',
  );
  await expect(page).toHaveURL(/\/studio\/upload$/);
});

test('the search box announces how many results it found', async ({ page }) => {
  await signIn(page);
  await page.goto('/');
  await acknowledgeGuidelines(page);
  await page
    .getByRole('combobox', { name: 'Search artists, tracks, and playlists' })
    .fill('night');
  await expect(
    page.getByRole('status').filter({ hasText: /^\d+ results?$/ }),
  ).toHaveCount(1);
});

test('listener: notifications name their panel and say which are unread', async ({
  page,
}) => {
  await signIn(page, 'listener@tahti.live');
  await page.goto('/notifications');
  await acknowledgeGuidelines(page);
  await expect(
    main(page)
      .getByRole('status')
      .filter({ hasText: /unread/i }),
  ).toBeVisible();
  await expect(
    main(page)
      .getByRole('listitem')
      .filter({ hasText: /^Unread / })
      .first(),
  ).toBeAttached();
  await page.getByRole('button', { name: /^Signed in as/ }).click();
  await page.getByRole('menuitem', { name: /^Notifications/ }).click();
  await expect(
    page.getByRole('region', { name: 'Notifications', exact: true }),
  ).toBeVisible();
});
