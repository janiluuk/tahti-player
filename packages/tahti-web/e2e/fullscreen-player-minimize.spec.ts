import { expect, test, type Page } from '@playwright/test';

/** Mock-mode recurring "finish your profile" toasts float over the header
 * and reappear across navigations -- unrelated to what this test covers. */
async function clearToasts(page: Page): Promise<void> {
  await page.evaluate(() => {
    document
      .querySelectorAll('[data-sonner-toast]')
      .forEach((el) => el.remove());
  });
}

// Regression for a real click-target bug in FullScreenPlayer.tsx: the
// back-arrow header (`absolute inset-x-0 top-0`) and the centered content
// column below it (`relative flex-1`, the header's only in-flow sibling,
// so flex-1 stretches it to cover the same top strip) shared z-10. Equal
// z-index resolves hit-testing by DOM order, so the content column — which
// paints nothing at that point, hence the arrow still being visible —
// intercepted the click instead of the button underneath. A synthetic
// `.click()` on the button element (bypassing hit-testing) worked fine,
// which is what made this easy to miss from source alone; only a real
// coordinate click at the button's rendered position reproduces it.
test('full player view: back arrow actually minimizes the player', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('artist@tahti.live');
  await page.getByLabel('Password').fill('demo-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(
    page.getByRole('button', { name: /^Signed in as/ }),
  ).toBeVisible();
  await page.goto('/library/sounds');
  await clearToasts(page);
  await page
    .getByRole('button', { name: /^Play / })
    .first()
    .click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

  await clearToasts(page);
  await page.getByRole('button', { name: 'Full screen' }).click();

  const minimize = page.getByRole('button', { name: 'Minimize player' });
  await expect(minimize).toBeVisible();
  await clearToasts(page);
  // The open/close overlay animation (ANIMATION_MS in FullScreenPlayer.tsx)
  // must settle before a real click coordinate is meaningful.
  await page.waitForTimeout(400);

  // A real, coordinate-based click -- not `.click()` via JS -- is the
  // part that actually exercises the hit-testing bug above.
  await minimize.click();

  await expect(minimize).toBeHidden();
});
