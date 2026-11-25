import { expect, test, type Locator, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signInAsBoard } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsBoard(page);
});

function rotationRows(page: Page): Locator {
  return page
    .getByRole('main')
    .getByRole('tabpanel', { name: 'Playlist' })
    .getByTestId('track-row');
}

async function expectOrder(rows: Locator, titles: string[]): Promise<void> {
  await expect(rows).toHaveCount(titles.length);
  for (const [index, title] of titles.entries()) {
    const row = rows.nth(index);
    await expect(row.getByRole('cell').first()).toHaveText(String(index + 1));
    await expect(row).toContainText(title);
  }
}

test('admin: the radio playlist marks On air and Up next, and a row moves down from its menu', async ({
  page,
}) => {
  await page.goto('/admin/radio?tab=playlist');
  await acknowledgeGuidelines(page);

  const rows = rotationRows(page);
  await expectOrder(rows, ['Night Transit', 'Aurora Drift']);

  const nightTransit = rows.filter({ hasText: 'Night Transit' });
  const auroraDrift = rows.filter({ hasText: 'Aurora Drift' });
  await expect(auroraDrift).toHaveAttribute('aria-current', 'true');
  await expect(auroraDrift.getByText('On air')).toBeVisible();
  await expect(nightTransit.getByText('Up next')).toBeVisible();

  await nightTransit.getByRole('button', { name: 'Track options' }).click();
  await expect(page.getByRole('menuitem', { name: 'Move up' })).toBeDisabled();
  await page.getByRole('menuitem', { name: 'Move down' }).click();

  await expectOrder(rows, ['Aurora Drift', 'Night Transit']);
  await expect(auroraDrift.getByText('On air')).toBeVisible();
  await expect(nightTransit.getByText('Up next')).toBeVisible();
});
