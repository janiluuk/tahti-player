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
    // Under 768px the row is a two-column grid: the artwork spans the title
    // and waveform rows, the actions take the full width below. The
    // waveform must fill its column, from past the artwork to the right
    // edge shared with the full-width actions row.
    const waveform = (await row.locator('[data-waveform]').boundingBox())!;
    const artwork = (await row
      .getByTestId('ambient-track-row-artwork')
      .boundingBox())!;
    const actions = (await row
      .getByTestId('ambient-track-row-actions')
      .boundingBox())!;
    expect(waveform.x).toBeGreaterThanOrEqual(artwork.x + artwork.width);
    expect(
      Math.abs(waveform.x + waveform.width - (actions.x + actions.width)),
    ).toBeLessThanOrEqual(1);
    expect(actions.x).toBeLessThanOrEqual(artwork.x + 1);
  }
  await page.screenshot({
    path: test.info().outputPath('listings-mobile.png'),
  });
});
