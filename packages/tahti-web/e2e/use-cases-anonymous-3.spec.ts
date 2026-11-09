import { expect, test } from '@playwright/test';

import { E2E_LISTENER_EMAIL, E2E_LISTENER_PASSWORD } from './helpers/auth';

test('anonymous: a listening party link asks to log in and stays on the party', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/party/lp-mock-scheduled');
  const login = page.getByRole('dialog', { name: 'Log in' });
  await expect(login.getByRole('heading', { name: 'Log in' })).toBeVisible();
  await login.getByLabel('Email').fill(E2E_LISTENER_EMAIL);
  await login.getByLabel('Password').fill(E2E_LISTENER_PASSWORD);
  await login.getByRole('button', { name: 'Sign in' }).click();
  await expect(login).toHaveCount(0);
  await expect(page).toHaveURL(/\/party\/lp-mock-scheduled$/);
  await expect(
    page.getByRole('button', { name: 'Join at the start' }),
  ).toBeVisible();
});
