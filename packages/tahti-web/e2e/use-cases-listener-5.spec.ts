import { expect, test } from '@playwright/test';

import { acknowledgeGuidelines, signInAsListener } from './helpers/auth';

test('listener on a phone: no Studio in the bottom nav or the More drawer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsListener(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await acknowledgeGuidelines(page);
  const bottomNav = page.getByTestId('mobile-bottom-nav');
  await expect(bottomNav.getByRole('link', { name: 'Listen' })).toBeVisible();
  await expect(bottomNav.getByRole('link', { name: 'Studio' })).toHaveCount(0);
  await bottomNav.getByRole('button', { name: 'More' }).click();
  const drawer = page.getByTestId('mobile-drawer');
  await expect(
    drawer.getByRole('link', { name: 'Library' }).first(),
  ).toBeVisible();
  await expect(drawer.getByRole('link', { name: 'Studio' })).toHaveCount(0);
});

test('listener: queues a track and finds it in the Queue panel', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsListener(page);
  await page.goto('/u/northern-lights');
  await acknowledgeGuidelines(page);
  const row = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: 'Aurora Drift' }) })
    .first();
  await row.getByRole('button', { name: /^Queue / }).click();
  await expect(row.getByRole('button', { name: /^In queue/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Expand right panel' }).click();
  await expect(
    page
      .getByRole('complementary', { name: 'Queue' })
      .getByText('Aurora Drift')
      .first(),
  ).toBeVisible();
});
