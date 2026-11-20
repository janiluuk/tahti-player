import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';

test('a new listener signs up, signs in and has no Studio or channel prompt', async ({
  page,
}) => {
  const email = `listener+${Date.now()}@example.com`;
  const password = 'Listener-Passw0rd';
  await page.goto('/join');
  const join = page.getByRole('dialog', { name: 'Join' });
  await join.getByLabel('Email').fill(email);
  await join.getByRole('radio', { name: 'Listener' }).click();
  await expect(join.getByLabel('Artist name')).toHaveCount(0);
  await join.getByLabel('Display name').fill('Night Owl');
  await join.getByLabel('Password', { exact: true }).fill(password);
  await join.getByLabel('Confirm password').fill(password);
  await join.getByRole('button', { name: 'Create account' }).click();

  const signedIn = page.getByRole('button', { name: /^Signed in as/ });
  // Mock join ends on "Check your email" with a Sign in action that opens
  // the Log in form (title is "Log in", submit is still "Sign in").
  const continueSignIn = page
    .getByRole('dialog')
    .getByRole('button', { name: 'Sign in' });
  await expect(signedIn.or(continueSignIn)).toBeVisible();
  if (await continueSignIn.isVisible()) {
    await continueSignIn.click();
    const logIn = page.getByRole('dialog', { name: /Log in|Sign in/i });
    await logIn.getByLabel('Email').fill(email);
    await logIn.getByLabel('Password', { exact: true }).fill(password);
    await logIn.getByRole('button', { name: 'Sign in' }).click();
  }
  await expect(signedIn).toBeVisible();

  await page.goto('/');
  const main = page.getByRole('navigation', { name: 'Main' });
  await expect(main.getByRole('link', { name: 'Listen' })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Studio' })).toHaveCount(0);
  await expect(page.getByText('Finish setting up your profile?')).toHaveCount(
    0,
  );
});

test('listener adds a track to a collaborative playlist and undoes it', async ({
  page,
}) => {
  await signIn(page, 'listener@tahti.live');
  await page.goto('/u/northern-lights/c/northern-lights-open-crate');
  const add = page.getByRole('region', { name: 'Add to this playlist' });
  await add.getByRole('textbox', { name: 'Search the catalog' }).fill('night');
  const result = add.getByRole('button', { name: /^Add / }).first();
  await result.click();
  const toast = page.getByRole('region', { name: /Notifications/ });
  await expect(toast.getByText(/^Added /)).toBeVisible();
  await toast.getByRole('button', { name: 'Undo' }).click();
  await expect(toast.getByText(/^Added /)).toHaveCount(0);
});
