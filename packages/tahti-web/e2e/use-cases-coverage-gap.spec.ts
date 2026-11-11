import { expect, test } from '@playwright/test';

import {
  acknowledgeGuidelines,
  signIn,
  signInAsListener,
} from './helpers/auth';

test('artist: likes a track from a list and finds it in Favorites', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await page.goto('/u/northern-lights');
  await acknowledgeGuidelines(page);
  const row = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: 'Archive Session 02' }) })
    .first();
  await row
    .getByRole('button', {
      name: 'Like Archive Session 02 (1 like)',
      exact: true,
    })
    .click();
  await expect(
    row.getByRole('button', { name: /Unlike Archive Session 02/ }),
  ).toBeVisible();
  await page.goto('/library/favorites');
  await acknowledgeGuidelines(page);
  await expect(
    page.getByRole('main').getByText('Archive Session 02').first(),
  ).toBeVisible();
});

test('anonymous: queues a track from an artist page without signing in', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/u/northern-lights');
  await acknowledgeGuidelines(page);
  const row = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: 'Archive Session 02' }) })
    .first();
  await row.getByRole('button', { name: /^Queue / }).click();
  await expect(row.getByRole('button', { name: /^In queue/ })).toBeDisabled();
});

test('listener: filters radio stations on Radio', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsListener(page);
  await page.goto('/radio');
  await acknowledgeGuidelines(page);
  const filter = page.getByPlaceholder(/Filter stations/).first();
  await filter.fill('helsinki');
  await expect(page.getByText('Radio Helsinki').first()).toBeVisible();
  await expect(page.getByText('YleX')).toHaveCount(0);
});

test('listener: the public schedule pages between weeks', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsListener(page);
  await page.goto('/schedule');
  await acknowledgeGuidelines(page);
  const range = page.locator('span.tabular-nums', { hasText: '–' }).first();
  const before = await range.textContent();
  await page.getByRole('button', { name: /Next week/ }).click();
  await expect(range).not.toHaveText(before ?? '');
  await page.getByRole('button', { name: /Previous week/ }).click();
  await expect(range).toHaveText(before ?? '');
});

test('artist: History shows listening stats across devices', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await page.goto('/library/history');
  await acknowledgeGuidelines(page);
  await expect(page.getByText('Across your devices')).toBeVisible();
  await expect(page.getByText('Time listened')).toBeVisible();
  await page.getByRole('radio', { name: '7 days' }).click();
  await expect(page.getByRole('radio', { name: '7 days' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('tab', { name: /Listening history/ }).click();
  await expect(page).toHaveURL(/history/);
});

test('artist: Library → Playlists lists the playlists', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await page.goto('/library/collections');
  await acknowledgeGuidelines(page);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Collections' }),
  ).toBeVisible();
  await page.getByRole('tab', { name: /^Playlists/ }).click();
  await expect(page.getByText('Favorites mix').first()).toBeVisible();
});
