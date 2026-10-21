import { expect, test } from '@playwright/test';

import { E2E_EMAIL, E2E_PASSWORD } from './helpers/auth';

async function signIn(
  page: import('@playwright/test').Page,
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

async function openChannelDesigner(page: import('@playwright/test').Page) {
  await page.goto('/settings/channel');
  await expect(page.getByTestId('channel-backdrop-card').first()).toBeVisible();
}

/** ChannelDesigner's preview card and the real channel page's hero both
 * render through the same <ChannelBackdropCard> component (see
 * src/components/ChannelBackdropCard.tsx) specifically so they cannot drift
 * apart the way the old separate mockup used to. This asserts both surfaces
 * actually render it, with the same identity content. */
test('channel designer preview and the real channel page render the same backdrop card', async ({
  page,
}) => {
  await signIn(page);

  await openChannelDesigner(page);
  const designerCard = page.getByTestId('channel-backdrop-card').first();
  await expect(designerCard).toBeVisible();
  const designerName = await designerCard
    .getByTestId('channel-backdrop-card-name')
    .textContent();
  const designerHandle = await designerCard
    .getByTestId('channel-backdrop-card-handle')
    .textContent();

  await page
    .getByRole('link', { name: /Open my channel/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/channel\//);

  const liveCard = page.getByTestId('channel-backdrop-card').first();
  await expect(liveCard).toBeVisible();
  const liveName = await liveCard
    .getByTestId('channel-backdrop-card-name')
    .textContent();
  const liveHandle = await liveCard
    .getByTestId('channel-backdrop-card-handle')
    .textContent();

  expect(liveName).toBe(designerName);
  expect(liveHandle).toBe(designerHandle);
});

/** The real regression this guards against: the designer used to show a
 * hand-built mock (fake avatar circle, fake nav pills) that never actually
 * reflected a saved header-style change on the real page. Now both read
 * through the same component and the same mock-channel wiring, so a saved
 * edit shows up identically on the real page. */
test('a saved backdrop design change shows up on the real channel page', async ({
  page,
}) => {
  await signIn(page);

  await openChannelDesigner(page);
  const initialStyle = await page
    .getByTestId('channel-backdrop-card')
    .first()
    .getAttribute('data-header-style');
  const nextStyle = initialStyle === 'SOLID' ? 'GRADIENT' : 'SOLID';

  await page.getByRole('tab', { name: nextStyle }).click();
  await expect(
    page.getByTestId('channel-backdrop-card').first(),
  ).toHaveAttribute('data-header-style', nextStyle);

  await page.getByRole('button', { name: 'Save layout' }).click();
  await expect(page.getByText(/saved/i)).toBeVisible();

  await page
    .getByRole('link', { name: /Open my channel/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/channel\//);

  await expect(
    page.getByTestId('channel-backdrop-card').first(),
  ).toHaveAttribute('data-header-style', nextStyle);
});
