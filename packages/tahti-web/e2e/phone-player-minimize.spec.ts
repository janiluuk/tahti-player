import { expect, test, type Page } from '@playwright/test';

import { STANDARD_VIEWPORTS } from './helpers/viewports';

async function playFirstTrack(page: Page): Promise<void> {
  await page.goto('/u/northern-lights');
  await page
    .getByRole('main')
    .getByRole('button', { name: /^Play Aurora Drift ·/ })
    .click();
  await expect(
    page.getByTestId('mobile-player-bar').getByTestId('player-pause-button'),
  ).toBeVisible();
}

test('phone: the player bar minimizes to a strip and the choice survives a reload', async ({
  page,
}) => {
  await page.setViewportSize(STANDARD_VIEWPORTS.phone);
  await playFirstTrack(page);

  const bar = page.getByTestId('mobile-player-bar');
  await expect(bar).not.toHaveAttribute('data-minimized');
  const fullHeight = (await bar.boundingBox())!.height;

  await page.getByTestId('minimize-mobile-player-bar').click();
  await expect(bar).toHaveAttribute('data-minimized', '');
  const restore = page.getByTestId('restore-mobile-player-bar');
  await expect(restore).toBeVisible();
  await expect(bar.getByTestId('player-pause-button')).toBeVisible();
  await expect(page.getByTestId('minimize-mobile-player-bar')).toHaveCount(0);
  expect((await bar.boundingBox())!.height).toBeLessThan(fullHeight);

  await restore.click();
  await expect(bar).not.toHaveAttribute('data-minimized');
  await expect(page.getByTestId('minimize-mobile-player-bar')).toBeVisible();

  await page.getByTestId('minimize-mobile-player-bar').click();
  await expect(bar).toHaveAttribute('data-minimized', '');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await playFirstTrack(page);
  await expect(bar).toHaveAttribute('data-minimized', '');
  await expect(page.getByTestId('restore-mobile-player-bar')).toBeVisible();

  await page.getByTestId('restore-mobile-player-bar').click();
  await expect(bar).not.toHaveAttribute('data-minimized');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await playFirstTrack(page);
  await expect(bar).not.toHaveAttribute('data-minimized');
});
