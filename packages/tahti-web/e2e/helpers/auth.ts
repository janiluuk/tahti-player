import { expect, type Page } from '@playwright/test';

export const E2E_EMAIL = process.env.TAHTI_E2E_EMAIL ?? 'artist@tahti.live';
export const E2E_PASSWORD = process.env.TAHTI_E2E_PASSWORD ?? 'demo-password';

/** Sign in via the auth dialog and mark the account as onboarded. */
export async function signIn(
  page: Page,
  email = E2E_EMAIL,
  password = E2E_PASSWORD,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
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
