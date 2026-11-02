import { expect, test } from '@playwright/test';

import { collectPageErrors } from './helpers/routeHealth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test('anonymous: plays a track page and pauses it from the player bar', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await page.goto('/t/demo-archive-1');
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Play', exact: true })
    .first()
    .click();
  await expect(page.getByTestId('now-playing-title')).toHaveText(
    'Midnight Broadcast',
  );
  await expect(page.getByTestId('player-loading-spinner')).toHaveCount(0);
  await page.getByTestId('player-pause-button').click();
  await expect(page.getByTestId('player-play-button')).toBeVisible();
  expect(errors).toEqual([]);
});

test('anonymous: reactions ask to log in; a favorite is kept on this device', async ({
  page,
}) => {
  await page.goto('/t/demo-archive-1');
  const main = page.getByRole('main');
  await expect(
    main.getByRole('button', { name: 'Log in to add ❤️ at 0:00' }),
  ).toBeVisible();
  await main.getByRole('button', { name: 'Favorite', exact: true }).click();
  await page.goto('/library/favorites');
  await expect(
    page.getByRole('main').getByText('Midnight Broadcast').first(),
  ).toBeVisible();
});

test('anonymous: searches and opens a track result', async ({ page }) => {
  await page.goto('/search?q=night');
  await expect(
    page.getByRole('heading', { level: 1, name: /Results for/ }),
  ).toBeVisible();
  await page
    .getByRole('main')
    .getByRole('link', { name: 'Midnight Broadcast' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/t\/northern-lights-archive-2$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Midnight Broadcast' }),
  ).toBeVisible();
});

test('anonymous: Studio explains it needs an account', async ({ page }) => {
  await page.goto('/studio');
  await expect(
    page.getByText(
      'Sign in to manage your catalog, uploads, and audio editor.',
    ),
  ).toBeVisible();
  await page.getByRole('main').getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByLabel('Password')).toBeVisible();
});

test('anonymous: reset password needs an email before it sends', async ({
  page,
}) => {
  await page.goto('/forgot-password');
  const send = page.getByRole('button', { name: 'Send reset link' });
  await expect(send).toBeDisabled();
  await page.getByLabel('Email').fill('liina@example.com');
  await expect(send).toBeEnabled();
  await send.click();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});

test('anonymous: opens a channel page from Live now', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('main')
    .getByRole('link', { name: 'Northern Lights' })
    .first()
    .click();
  await expect(page).toHaveURL(/\/channel\/northern-lights$/);
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});
