import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test('a collection opens read-only and Edit details reveals the form', async ({
  page,
}) => {
  await page.goto('/library/collections/midnight-archive');
  await expect(page.getByRole('heading', { name: 'Tracklist' })).toBeVisible();
  await expect(page.getByLabel('Release date')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit details' }).click();
  await expect(page).toHaveURL(/edit=true/);
  await expect(page.getByLabel('Release date')).toBeVisible();
  await page.getByRole('button', { name: 'Done editing' }).click();
  await expect(page.getByLabel('Release date')).toHaveCount(0);
});

test('Edit on a release in the list opens it in edit mode', async ({
  page,
}) => {
  await page.goto('/studio/releases');
  await page
    .getByRole('main')
    .getByRole('link', { name: /^Edit / })
    .first()
    .click();
  await expect(page).toHaveURL(/\/studio\/releases\/[^?]+\?edit=true/);
  await expect(
    page.getByRole('button', { name: 'Done editing' }).first(),
  ).toBeVisible();
  await expect(page.getByLabel('Description')).toBeVisible();
});

test('a sound shows Playlists and Insights until Edit details adds the form', async ({
  page,
}) => {
  await page.goto('/studio/sounds/arch-mock-2');
  await expect(page.getByRole('tab', { name: 'Insights' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Details' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit details' }).click();
  await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
  await expect(page.getByLabel('Release date')).toBeVisible();
});

test('Stats shows where listeners came from', async ({ page }) => {
  await page.goto('/studio/stats');
  const sources = page.getByTestId('stats-referrers');
  await expect(sources).toBeVisible();
  await expect(
    sources.getByText(/^instagram\.com · \d+ listens$/),
  ).toBeVisible();
  await expect(sources.getByText(/^Direct or unknown · /)).toBeVisible();
});

test('the Radio Browser add-on can be turned off after activating it', async ({
  page,
}) => {
  await page.goto('/settings/plugin-store?category=radio');
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await settings.getByRole('button', { name: 'Activate', exact: true }).click();
  const off = settings.getByRole('switch', {
    name: 'Radio Browser directory on',
  });
  await expect(off).toBeChecked();
  await off.click();
  await expect(off).toHaveCount(0);
});
