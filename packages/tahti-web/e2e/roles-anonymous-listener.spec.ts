import { expect, test } from '@playwright/test';

import { acknowledgeGuidelines, signInAsListener } from './helpers/auth';
import { collectPageErrors } from './helpers/routeHealth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test('anonymous: Library keeps account tabs visible but disabled', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await page.goto('/library');
  await expect(page.getByRole('tab', { name: 'Favorites' })).toBeEnabled();
  await expect(
    page.getByRole('tab', { name: 'History, needs an account' }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

test('anonymous: Admin and Messages ask to sign in instead of failing', async ({
  page,
}) => {
  for (const [path, prompt] of [
    ['/admin', 'Sign in with a board member account to continue.'],
    ['/messages', 'Sign in to read DMs.'],
  ] as const) {
    await page.goto(path);
    await expect(page.getByText(prompt)).toBeVisible();
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
  }
});

test('anonymous: forgot password renders its form', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(
    page.getByRole('heading', { name: 'Reset your password' }),
  ).toBeVisible();
});

test('anonymous: log in offers Google and Facebook; a failed return explains why', async ({
  page,
}) => {
  await page.goto('/login');
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('button', { name: 'Continue with Google' }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Continue with Facebook' }),
  ).toBeVisible();

  await page.goto('/?oauth_error=email_in_use');
  await expect(
    page
      .getByRole('dialog')
      .getByText(/An account with this email already exists/),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/oauth_error/);
});

test('listener: no Studio in the sidebar; Studio and Admin explain the gate', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await signInAsListener(page);
  const sidebar = page.getByTestId('sidebar-navigation-item');
  await expect(sidebar.filter({ hasText: /^Studio$/ })).toHaveCount(0);
  await expect(sidebar.filter({ hasText: /^Become an artist$/ })).toHaveCount(
    1,
  );

  await page.goto('/studio');
  await expect(
    page.getByRole('heading', { name: 'Studio is for artists' }),
  ).toBeVisible();

  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: 'Board access required' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('listener: Library opens on Favorites; Following is a Library tab', async ({
  page,
}) => {
  await signInAsListener(page);
  await page.goto('/library');
  await expect(page).toHaveURL(/\/library\/favorites$/);
  await acknowledgeGuidelines(page);
  await page.goto('/library/following');
  await expect(page).toHaveURL(/\/library\/following$/);
  await expect(page.getByTestId('library-following')).toBeVisible();
  await page.goto('/settings/artist?tab=following');
  await expect(page).toHaveURL(/\/library\/following$/);
});
