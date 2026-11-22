import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';

test.use({ viewport: { width: 390, height: 844 } });

test('large and medium music rows fit a phone and render real waveforms', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/sounds');
  const list = page.getByTestId('ambient-track-list');
  await expect(list).toBeVisible();
  for (const size of ['Large', 'Medium']) {
    await page
      .getByRole('button', { name: /^Track size/ })
      .first()
      .click();
    await page.getByRole('menuitemradio', { name: size, exact: true }).click();
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
  await page.screenshot({
    path: test.info().outputPath('listings-mobile.png'),
  });
});
