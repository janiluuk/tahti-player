import { expect, test } from '@playwright/test';

import { E2E_EMAIL, E2E_PASSWORD } from './helpers/credentials';

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(E2E_EMAIL);
  await page.getByLabel('Password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(
    page.getByRole('button', { name: /^Signed in as/ }),
  ).toBeVisible();
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    const userId = raw ? JSON.parse(raw)?.state?.user?.id : null;
    if (typeof userId === 'string') {
      localStorage.setItem(`tahti-web-onboarded:${userId}`, '1');
    }
  });
}

test('studio branding designer lists usable artist-page blocks', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/branding?tab=channel-designer');
  const editor = page.getByTestId('channel-element-editor');
  await expect(editor).toBeVisible();
  await editor.getByRole('button', { name: 'Section', exact: true }).click();
  await expect(page.getByRole('option', { name: 'Releases' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Tracks' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Latest' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Feed' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'News' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Player' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Backdrop' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Header' })).toHaveCount(0);
  await expect(page.getByRole('option', { name: 'Actions' })).toHaveCount(0);
});

test('artist page designer uses the element menu', async ({ page }) => {
  await signIn(page);
  await page.goto('/u/artist');
  await page.getByRole('tab', { name: 'Design' }).click();
  const editor = page.getByTestId('channel-element-editor');
  await expect(editor).toBeVisible();
  await expect(page.getByText('Channel appearance')).toHaveCount(0);
  await editor.getByRole('button', { name: 'Section', exact: true }).click();
  await expect(page.getByRole('option', { name: 'Player' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Backdrop' })).toBeVisible();
});
