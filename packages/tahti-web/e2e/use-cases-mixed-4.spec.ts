import { expect, test, type Page } from '@playwright/test';

import {
  acknowledgeGuidelines,
  signInAsBoard,
  signInAsListener,
} from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

test('anonymous: plays a release card from the front page', async ({
  page,
}) => {
  await open(page, '/');
  await page.getByRole('button', { name: 'Play Night Drive' }).click();
  await expect(page.getByTestId('now-playing-title')).not.toBeEmpty();
});

test('listener: deletes their own timed comment', async ({ page }) => {
  await signInAsListener(page);
  await open(page, '/t/demo-archive-1');
  const remove = page
    .getByRole('main')
    .getByRole('button', { name: 'Delete comment by Listener' })
    .first();
  await expect(remove).toBeVisible();
  const before = await page
    .getByRole('main')
    .getByRole('button', { name: 'Delete comment by Listener' })
    .count();
  await remove.click();
  const confirm = page.getByRole('button', { name: /^(Delete|Confirm)$/ });
  if (await confirm.isVisible()) {
    await confirm.click();
  }
  await expect(
    page
      .getByRole('main')
      .getByRole('button', { name: 'Delete comment by Listener' }),
  ).toHaveCount(before - 1);
});

test('admin: adds a track to the Tahti Selects rotation', async ({ page }) => {
  await signInAsBoard(page);
  await open(page, '/admin/tahti-selects');
  const heading = page
    .getByRole('main')
    .getByRole('heading', { name: /^Current rotation \(\d+\)$/ });
  const count = async () =>
    Number(/\((\d+)\)/.exec((await heading.textContent()) ?? '')?.[1] ?? 0);
  const before = await count();
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Add content to rotation' })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Add content to Tahti Selects',
  });
  await dialog
    .getByRole('button', { name: /^Select / })
    .first()
    .click();
  await dialog.getByRole('button', { name: /^Add .*rotation$/ }).click();
  await expect.poll(count).toBe(before + 1);
});
