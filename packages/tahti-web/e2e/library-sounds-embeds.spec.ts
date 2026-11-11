import { expect, test } from '@playwright/test';

import { acknowledgeGuidelines, signIn } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
});

test('artist: Sounds → Embeds tab plays a hearthis embed', async ({ page }) => {
  await page.goto('/library/sounds');
  await acknowledgeGuidelines(page);
  await expect(page.getByRole('heading', { name: /^Sounds$/ })).toBeVisible();

  await page.getByRole('tab', { name: 'Embeds' }).click();
  await expect(page.getByTestId('sounds-panel-embeds')).toBeVisible();
  await expect(page).toHaveURL(/\/library\/sounds\?tab=embeds/);

  const panel = page.getByTestId('sounds-panel-embeds');
  const play = panel.getByRole('button', {
    name: 'Play Imported from hearthis.at on hearthis.at',
  });
  await expect(play).toBeVisible({ timeout: 15_000 });
  await play.click();
  await expect(panel.getByTestId('hearthis-row-embed')).toHaveCount(0);
  await expect(page.getByTestId('hearthis-player-embed')).toBeVisible();
  await expect(page.getByTestId('now-playing-title')).toHaveCount(0);
});
