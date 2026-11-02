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

test('admin: suspends an account with a reason and restores it', async ({
  page,
}) => {
  await open(page, '/admin/users');
  await main(page)
    .getByRole('radio', { name: /^Listener One/ })
    .click();
  await main(page)
    .getByRole('textbox', { name: 'Suspension reason' })
    .fill('Spam in chat');
  await main(page).getByRole('button', { name: 'Suspend account' }).click();
  const confirm = page.getByRole('button', { name: /^(Suspend|Confirm)$/ });
  if (await confirm.isVisible()) {
    await confirm.click();
  }
  const restore = main(page).getByRole('button', {
    name: /^(Restore|Unsuspend|Lift suspension)/,
  });
  await expect(restore.first()).toBeVisible();
  await restore.first().click();
  await expect(
    main(page).getByRole('button', { name: 'Suspend account' }),
  ).toBeVisible();
});

test('admin: approves an add-on that needs review', async ({ page }) => {
  await open(page, '/admin/addons');
  const approve = main(page).getByRole('button', {
    name: 'Approve Now spinning ticker',
  });
  await approve.click();
  await expect(approve).toHaveCount(0);
});

test('admin: a grant year opens from Co-op governance', async ({ page }) => {
  await open(page, '/admin/governance/grants');
  await main(page).getByRole('link', { name: 'View 2025 grants' }).click();
  await expect(page).toHaveURL(/\/admin\/grants\/2025$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByTestId('admin-hub-back')).toHaveAttribute(
    'href',
    '/admin/hubs/coop',
  );
});

test('admin: Financial shows subscriptions, payouts and the ledger', async ({
  page,
}) => {
  await open(page, '/admin/financial');
  for (const name of ['Fan subscriptions', 'Payout queue', 'Ledger entries']) {
    await expect(
      main(page).getByRole('heading', { level: 2, name, exact: true }),
    ).toBeVisible();
  }
});

test('admin: storage opens one user from the usage list', async ({ page }) => {
  await open(page, '/admin/storage');
  const user = main(page).locator('a[href^="/admin/storage/"]').first();
  await user.click();
  await expect(page).toHaveURL(/\/admin\/storage\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});
