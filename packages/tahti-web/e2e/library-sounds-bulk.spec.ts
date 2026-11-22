import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signIn } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
});

async function openSounds(page: Page) {
  await page.goto('/studio/sounds');
  await acknowledgeGuidelines(page);
  await expect(page.getByRole('heading', { name: /^Sounds$/ })).toBeVisible();
}

test('artist: select-all matching → bulk edit + Mix order', async ({
  page,
}) => {
  await openSounds(page);
  const main = page.getByRole('main');

  await main.getByRole('button', { name: /^Track size/ }).click();
  await page.getByRole('menuitemradio', { name: 'List' }).click();

  const firstCheckbox = main.getByRole('checkbox').first();
  await expect(firstCheckbox).toBeVisible({ timeout: 15_000 });
  await firstCheckbox.check();

  const toolbar = main.getByRole('toolbar', { name: /selected/i });
  await expect(toolbar).toBeVisible();

  const selectAll = toolbar.getByRole('button', {
    name: /Select all/i,
  });
  if (await selectAll.isVisible()) {
    await selectAll.click();
  }

  await toolbar.getByRole('button', { name: /^Edit$/i }).click();
  const dialog = page.getByRole('dialog', { name: /^Edit \d+ sounds?$/ });
  await expect(dialog.getByRole('heading')).toBeVisible();
  await dialog.getByRole('button', { name: /Cancel/i }).click();

  if (
    await toolbar
      .getByRole('button', { name: /Mix order/i })
      .isEnabled()
      .catch(() => false)
  ) {
    await toolbar.getByRole('button', { name: /Mix order/i }).click();
    await expect(
      page
        .getByRole('dialog', { name: /Mix order/i })
        .getByRole('heading')
        .first(),
    ).toBeVisible();
    await page.keyboard.press('Escape');
  }
});
