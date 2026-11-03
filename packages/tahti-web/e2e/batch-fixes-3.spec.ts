import { expect, test } from '@playwright/test';

import { signIn, signInAsListener } from './helpers/auth';

test('artist More holds Open channel; Follow and email Subscribe stay in the header', async ({
  page,
}) => {
  await page.goto('/u/northern-lights');
  const main = page.getByRole('main');
  await expect(
    main.getByRole('link', { name: 'Open channel', exact: true }),
  ).toHaveCount(0);
  await main.getByRole('button', { name: /More actions for / }).click();
  await expect(
    page.getByRole('button', { name: 'Open channel' }),
  ).toBeVisible();
});

test('community guidelines show as a Listen banner, not a toast over nav', async ({
  page,
}) => {
  await signInAsListener(page);
  await page.evaluate(() => {
    localStorage.removeItem('tahti-web-mock-notifications-dismissed');
  });
  await page.goto('/');
  await expect(page.getByTestId('guidelines-banner')).toBeVisible();
  await expect(page.getByTestId('app-top-nav')).toBeVisible();
  await expect(
    page.locator('[data-sonner-toast]').filter({
      hasText: 'community guidelines',
    }),
  ).toHaveCount(0);
});

test('Studio Stats uses section chips, not a nested Stats tab strip', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/stats');
  await expect(page.getByRole('tablist', { name: 'Stats pages' })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('radiogroup', { name: 'Stats sections' }),
  ).toBeVisible();
});

test('Messages has one compose field and one Message action', async ({
  page,
}) => {
  await signInAsListener(page);
  await page.goto('/messages');
  const main = page.getByRole('main');
  await expect(main.getByLabel('Find or message @')).toBeVisible();
  await expect(
    main.getByRole('button', { name: 'Message', exact: true }),
  ).toBeVisible();
  await expect(main.getByRole('button', { name: 'Start' })).toHaveCount(0);
  await expect(main.getByRole('button', { name: 'Search' })).toHaveCount(0);
});
