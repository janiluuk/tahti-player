import { expect, test } from '@playwright/test';

import { acknowledgeGuidelines, signIn } from './helpers/auth';

test('artist creates a show and lands on its page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await page.goto('/studio/shows');
  await acknowledgeGuidelines(page);
  const title = `Night Shift ${Date.now()}`;
  await page
    .getByRole('main')
    .getByRole('button', { name: 'New show' })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: 'New show' });
  const create = dialog.getByRole('button', { name: 'Create show' });
  await expect(create).toBeDisabled();
  await dialog.getByRole('textbox', { name: 'Show title' }).fill(title);
  await create.click();
  await expect(page).toHaveURL(/\/studio\/shows\/[^/]+$/);
  await expect(
    page.getByRole('heading', { level: 1, name: title }),
  ).toBeVisible();
});

test('artist marks every notification read', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await page.goto('/notifications');
  await acknowledgeGuidelines(page);
  const main = page.getByRole('main');
  await main.getByRole('radio', { name: 'Music' }).click();
  await expect(main.getByRole('radio', { name: 'Music' })).toBeChecked();
  await main.getByRole('radio', { name: 'All' }).click();
  const markAll = main.getByRole('button', { name: 'Mark all read' });
  await markAll.click();
  await expect(main.getByText('All caught up')).toBeVisible();
});
