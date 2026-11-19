import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';
import { collectPageErrors } from './helpers/routeHealth';

test('release detail keeps back + title without a Studio section row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = collectPageErrors(page);
  await signIn(page);
  await page.goto('/studio/releases');
  const firstRelease = page
    .locator('a[href*="/studio/releases/"]')
    .filter({ hasNotText: 'New' })
    .first();
  await expect(firstRelease).toBeVisible();
  await firstRelease.click();
  await expect(page).toHaveURL(/\/studio\/releases\/[^/]+$/);
  await expect(page.getByRole('link', { name: /Back/i }).first()).toBeVisible();
  await expect(page.locator('[data-studio-navigation]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
