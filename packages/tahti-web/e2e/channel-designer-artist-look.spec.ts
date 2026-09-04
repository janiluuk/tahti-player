import { expect, test } from '@playwright/test';

async function signIn(
  page: import('@playwright/test').Page,
  email = 'artist@tahti.live',
  password = process.env.TAHTI_E2E_PASSWORD ?? 'demo-password',
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

/** Saved Channel Designer header style must paint the public artist page
 * header (`EntitySocialHeader`), not only `/channel/:slug`. */
test('a saved backdrop design change shows up on the artist page header', async ({
  page,
}) => {
  await signIn(page);

  await page.goto('/studio/branding?tab=channel-designer');
  const designerCard = page.getByTestId('channel-backdrop-card').first();
  await expect(designerCard).toBeVisible();
  const initialStyle = await designerCard.getAttribute('data-header-style');
  const nextStyle = initialStyle === 'SOLID' ? 'GRADIENT' : 'SOLID';

  await page.getByRole('tab', { name: nextStyle }).click();
  await expect(designerCard).toHaveAttribute('data-header-style', nextStyle);
  await page.getByRole('button', { name: 'Save layout' }).click();
  await expect(page.getByText(/saved/i)).toBeVisible();

  await page.goto('/u/artist');
  const artistHeader = page.getByTestId('entity-social-header');
  await expect(artistHeader).toBeVisible();
  await expect(artistHeader).toHaveAttribute('data-header-style', nextStyle);
});
