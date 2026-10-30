import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';

test.use({ viewport: { width: 390, height: 844 } });

test('homepage article opens with artwork and a humanized publication date', async ({
  page,
}) => {
  await page.goto('/');
  const article = page
    .getByTestId('article-card')
    .filter({ hasText: 'Tahti is open. Come find your next favourite.' });
  await article.scrollIntoViewIfNeeded();
  await article.click();
  const dialog = page.getByRole('dialog');
  await expect(page.getByTestId('news-article')).toBeVisible();
  await expect(dialog.locator('img')).toBeVisible();
  await expect
    .poll(() =>
      dialog
        .locator('img')
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  const imageBox = await dialog.locator('img').boundingBox();
  expect(imageBox!.height).toBeLessThan(220);
  await expect(dialog.locator('time')).toBeVisible();
  await expect(dialog).toContainText('No ads. No tracking.');
  await expect(
    dialog.getByRole('button', { name: 'Edit article' }),
  ).toHaveCount(0);
  expect(
    await page
      .getByTestId('news-article')
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: '/private/tmp/tahti-news-mobile.png' });
  await dialog
    .getByRole('button', { name: 'Close', exact: true })
    .last()
    .click();
  await expect(dialog).toHaveCount(0);
});

test('large and medium music rows fit a phone and render real waveforms', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/library/sounds');
  const list = page.getByTestId('ambient-track-list');
  await expect(list).toBeVisible();
  for (const size of ['Large', 'Medium']) {
    await list.getByRole('radio', { name: size, exact: true }).click();
    const row = page.getByTestId('ambient-track-row').first();
    await row.scrollIntoViewIfNeeded();
    await expect(row.locator('[data-waveform="peaks"]').first()).toBeVisible();
    await expect(row.locator('[data-state="ready"]').first()).toBeVisible();
    expect(await row.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    const waveform = await row.locator('[data-waveform]').boundingBox();
    const bounds = await row.boundingBox();
    expect(waveform!.width).toBeGreaterThan(bounds!.width * 0.85);
  }
  await page.screenshot({ path: '/private/tmp/tahti-listings-mobile.png' });
});
