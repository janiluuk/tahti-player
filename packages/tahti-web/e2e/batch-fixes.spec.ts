import { expect, test } from '@playwright/test';

import { signIn, signInAsBoard } from './helpers/auth';

test('Listen station cards name Play and Favorite after the station', async ({
  page,
}) => {
  await signIn(page, 'listener@tahti.live');
  await page.goto('/');
  const main = page.getByRole('main');
  await expect(main.getByRole('button', { name: 'Play YleX' })).toBeVisible();
  await expect(
    main.getByRole('button', { name: 'Favorite YleX' }),
  ).toBeVisible();
  await expect(
    main.getByRole('button', { name: 'Favorite', exact: true }),
  ).toHaveCount(0);
});

test('a mock release page is titled after its slug', async ({ page }) => {
  await page.goto('/r/night-drive');
  await expect(
    page.getByRole('heading', { name: 'Night Drive', level: 1 }),
  ).toBeVisible();
});

test('the press kit lists photos once with both limits', async ({ page }) => {
  await signIn(page);
  await page.goto('/settings/artist?tab=press-kit');
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(settings.getByText(/up to 30 photos/)).toBeVisible();
  await expect(settings.getByText('Press kit images')).toHaveCount(0);
  await expect(
    settings.getByText('Add images in the Gallery tab first.'),
  ).toHaveCount(0);
});

test('Branding has no second "Artist branding" heading', async ({ page }) => {
  await signIn(page);
  await page.goto('/settings/artist?tab=branding');
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(
    settings.getByRole('heading', { name: 'Profile picture' }),
  ).toBeVisible();
  await expect(
    settings.getByRole('heading', { name: 'Artist branding' }),
  ).toHaveCount(0);
});

test('Tahti Radio rotation lists each track artist', async ({ page }) => {
  await signInAsBoard(page);
  await page.goto('/admin/radio');
  const main = page.getByRole('main');
  await expect(main.getByText('Night Transit').first()).toBeVisible();
  await expect(main.getByText('Tahti Radio submissions')).toHaveCount(0);
});

test('opening a conversation does not remount the page', async ({ page }) => {
  await signIn(page, 'listener@tahti.live');
  await page.goto('/messages');
  const main = page.getByRole('main');
  const recipient = main.getByRole('textbox', { name: 'Message @' });
  await recipient.fill('someone');
  await main
    .getByRole('button', { name: /^Listener One Loved the set/ })
    .click();
  await expect(page).toHaveURL(/\/messages\/[^/]+$/);
  await expect(recipient).toHaveValue('someone');
});
