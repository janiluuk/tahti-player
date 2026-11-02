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

const main = (page: Page) => page.getByRole('main');

test('admin: replies to a support ticket', async ({ page }) => {
  const reply = `We are on it ${Date.now()}`;
  await open(page, '/admin/moderation/support');
  await main(page)
    .getByRole('textbox', { name: 'Reply to ticket' })
    .fill(reply);
  await main(page).getByRole('button', { name: 'Reply', exact: true }).click();
  await expect(main(page).getByText(reply)).toBeVisible();
});

test('admin: resolves a support ticket', async ({ page }) => {
  await open(page, '/admin/moderation/support');
  await main(page)
    .getByRole('button', { name: 'Resolve', exact: true })
    .click();
  await expect(
    main(page).getByRole('button', { name: 'Resolve', exact: true }),
  ).toHaveCount(0);
});

test('admin: approves a radio submission', async ({ page }) => {
  await open(page, '/admin/moderation/radio-submissions');
  await expect(
    main(page).getByRole('heading', { level: 3, name: 'Moonlight Drive' }),
  ).toBeVisible();
  await main(page).getByRole('button', { name: 'Approve to radio' }).click();
  await expect(
    page.getByText('Moonlight Drive is approved for Tahti Radio.'),
  ).toBeVisible();
  await expect(main(page).getByText('Approved').first()).toBeVisible();
});

test('admin: dismisses a content report', async ({ page }) => {
  await open(page, '/admin/moderation/content-reports');
  const dismiss = main(page).getByRole('button', {
    name: 'Dismiss',
    exact: true,
  });
  await expect(dismiss.first()).toBeVisible();
  const before = await dismiss.count();
  await dismiss.first().click();
  await expect(dismiss).toHaveCount(before - 1);
});

test('admin: unverifies and re-verifies a venue', async ({ page }) => {
  await open(page, '/admin/venues');
  await main(page).getByRole('button', { name: 'Unverify' }).first().click();
  const verify = main(page).getByRole('button', {
    name: 'Verify',
    exact: true,
  });
  await expect(verify.first()).toBeVisible();
  await verify.first().click();
  await expect(
    main(page).getByRole('button', { name: 'Unverify' }).first(),
  ).toBeVisible();
});

test('admin: top lists switch period', async ({ page }) => {
  await open(page, '/admin/top-lists');
  const half = main(page).getByRole('radio', { name: 'Half year' });
  await half.click();
  await expect(half).toHaveAttribute('aria-checked', 'true');
});

test('admin: logs filter by area and open container logs', async ({ page }) => {
  await open(page, '/admin/logs');
  const finance = main(page).getByRole('radio', { name: 'Finance & grants' });
  await finance.click();
  await expect(finance).toHaveAttribute('aria-checked', 'true');
  await main(page).getByRole('tab', { name: 'Container logs' }).click();
  await expect(
    main(page).getByRole('tab', { name: 'Container logs' }),
  ).toHaveAttribute('aria-selected', 'true');
});

test('admin: storage shows usage and the file list', async ({ page }) => {
  await open(page, '/admin/storage');
  await expect(
    main(page).getByRole('heading', { name: 'Top users by storage usage' }),
  ).toBeVisible();
  await main(page).getByRole('tab', { name: 'Files' }).click();
  await expect(main(page).getByRole('tab', { name: 'Files' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('admin: Co-op governance tabs for grants and the AGM open', async ({
  page,
}) => {
  await open(page, '/admin/governance');
  for (const name of ['Grants', 'AGM', 'Records']) {
    await main(page).getByRole('tab', { name, exact: true }).click();
    await expect(
      main(page).getByRole('tab', { name, exact: true }),
    ).toHaveAttribute('aria-selected', 'true');
  }
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});

test('admin: add-ons filter to the ones that need review', async ({ page }) => {
  await open(page, '/admin/addons');
  const review = main(page).getByRole('radio', { name: /^Needs review/ });
  await review.click();
  await expect(review).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});

test('admin: New language opens its form', async ({ page }) => {
  await open(page, '/admin/i18n');
  await main(page).getByRole('button', { name: 'New language' }).click();
  const dialog = page.getByRole('dialog', { name: 'New language' });
  await expect(
    dialog.getByRole('button', { name: 'Add language' }),
  ).toBeDisabled();
  await dialog.getByRole('textbox', { name: 'Code (e.g. sv)' }).fill('sv');
  await dialog
    .getByRole('textbox', { name: 'Name (e.g. Swedish)' })
    .fill('Swedish');
  await expect(
    dialog.getByRole('button', { name: 'Add language' }),
  ).toBeEnabled();
});

test('admin: Tahti Selects opens the add-to-rotation picker', async ({
  page,
}) => {
  await open(page, '/admin/tahti-selects');
  await main(page)
    .getByRole('button', { name: 'Add content to rotation' })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Add content to Tahti Selects',
  });
  const add = dialog.getByRole('button', { name: /^Add .*rotation$/ });
  await expect(add).toBeDisabled();
  await dialog
    .getByRole('button', { name: /^Select / })
    .first()
    .click();
  await expect(add).toBeEnabled();
});
