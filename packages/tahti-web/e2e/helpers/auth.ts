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
    localStorage.setItem(
      'tahti-web-mock-notifications-dismissed',
      JSON.stringify(['notification-mock-sticky-policy']),
    );
  });
}

export const E2E_LISTENER_EMAIL =
  process.env.TAHTI_E2E_LISTENER_EMAIL ?? 'listener@tahti.live';
export const E2E_LISTENER_PASSWORD =
  process.env.TAHTI_E2E_LISTENER_PASSWORD ?? 'demo-password';

/** Signs in as a listener: an account without a channel. */
export async function signInAsListener(page: Page): Promise<void> {
  await signIn(page, E2E_LISTENER_EMAIL, E2E_LISTENER_PASSWORD);
}

/** Signs in as the artist, then gives the stored user the board role. */
export async function signInAsBoard(page: Page): Promise<void> {
  await signIn(page);
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth') as string;
    const auth = JSON.parse(raw);
    auth.state.user.role = 'BOARD';
    auth.state.user.roles = ['BOARD', 'ARTIST'];
    auth.state.user.isBoard = true;
    localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
  });
  await page.reload();
}

/** Dismisses the community guidelines toast when it covers the page. */
export async function acknowledgeGuidelines(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.setItem(
        'tahti-web-mock-notifications-dismissed',
        JSON.stringify(['notification-mock-sticky-policy']),
      );
    } catch {
      return;
    }
  });
  const acknowledge = page.getByRole('button', { name: 'Acknowledge' });
  if (await acknowledge.isVisible()) {
    await acknowledge.click();
  }
}
