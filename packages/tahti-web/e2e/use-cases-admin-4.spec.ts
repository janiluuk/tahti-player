import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signInAsBoard } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsBoard(page);
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

test('admin: turns an announcement clip off and plays it every Nth clip', async ({
  page,
}) => {
  await open(page, '/admin/announcements');
  const clip = page
    .getByRole('main')
    .getByRole('listitem')
    .filter({ hasText: 'Welcome to Tahti' });
  const enabled = clip.getByRole('switch', { name: 'Enable Welcome to Tahti' });
  await expect(enabled).toBeChecked();
  await enabled.click();
  await expect(enabled).not.toBeChecked();

  await expect(clip.getByRole('spinbutton', { name: 'Every Nth' })).toHaveCount(
    0,
  );
  await clip.getByRole('button', { name: 'Schedule' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Schedule' }).click();
  await page.getByRole('option', { name: 'Every Nth clip' }).click();
  await expect(
    dialog.getByRole('spinbutton', { name: 'Every Nth' }),
  ).toHaveValue('4');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(clip.getByText('Once every 4 clips')).toBeVisible();
});

test('admin: disables an artwork preset and removes another', async ({
  page,
}) => {
  await open(page, '/admin/artwork-presets');
  const main = page.getByRole('main');
  const first = main.getByRole('switch', {
    name: 'Enable artwork 1',
    exact: true,
  });
  await expect(first).toBeChecked();
  await first.click();
  await expect(first).not.toBeChecked();

  const items = main.getByRole('listitem');
  const before = await items.count();
  await main
    .getByRole('button', { name: 'Remove artwork 2', exact: true })
    .click();
  const confirm = page.getByRole('dialog', { name: 'Remove this artwork?' });
  await confirm.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('Artwork removed.')).toBeVisible();
  await expect(items).toHaveCount(before - 1);
});

test('admin: top lists regroup by genre and flip to least listened', async ({
  page,
}) => {
  await open(page, '/admin/top-lists');
  const main = page.getByRole('main');
  await expect(
    main.getByRole('heading', { level: 2, name: 'live sets' }),
  ).toBeVisible();
  await main
    .getByRole('radiogroup', { name: 'Top list grouping' })
    .getByRole('radio', { name: 'By genre' })
    .click();
  await expect(
    main.getByRole('heading', { level: 2, name: 'live sets' }),
  ).toHaveCount(0);

  const order = main.getByRole('radiogroup', { name: 'Top list order' });
  await order.getByRole('radio', { name: 'Least listened' }).click();
  await expect(
    order.getByRole('radio', { name: 'Least listened' }),
  ).toBeChecked();
});

test('admin: marks every notification read', async ({ page }) => {
  await open(page, '/notifications');
  const main = page.getByRole('main');
  const markAll = main.getByRole('button', { name: 'Mark all read' });
  await expect(markAll).toBeEnabled();
  await markAll.click();
  await expect(markAll).toBeDisabled();
  await expect(main.getByText('All caught up')).toBeVisible();
});
