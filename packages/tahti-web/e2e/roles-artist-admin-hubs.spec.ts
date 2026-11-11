import { expect, test } from '@playwright/test';

import { acknowledgeGuidelines, signIn, signInAsBoard } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

test('artist: Studio has six tabs and the Profile hub opens a Settings panel', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio');
  await acknowledgeGuidelines(page);
  const studioTabs = page
    .getByRole('navigation', { name: 'Studio pages' })
    .getByRole('link');
  await expect(studioTabs).toHaveText([
    'Home',
    'Music',
    'Broadcast',
    'Fans',
    'Stats',
    'Profile',
  ]);

  await page.goto('/studio/profile');
  await page
    .getByRole('list', { name: 'Artist profile settings' })
    .getByRole('link', { name: /Story/ })
    .click();
  await expect(page).toHaveURL(/\/settings\/artist\?tab=story$/);
  await expect(
    page
      .getByRole('dialog', { name: 'Settings' })
      .getByRole('tab', { name: 'Story' }),
  ).toHaveAttribute('aria-selected', 'true');
});

test('artist: a Fans page links back to the Fans hub', async ({ page }) => {
  await signIn(page);
  await page.goto('/studio/fans');
  await acknowledgeGuidelines(page);
  await page
    .getByRole('list', { name: 'Fans tools' })
    .getByRole('link', { name: /Earnings/ })
    .click();
  await expect(page).toHaveURL(/\/studio\/audience$/);
  await expect(page.getByRole('heading', { name: 'Earnings' })).toBeVisible();
  await page.getByTestId('studio-fans-back').click();
  await expect(page).toHaveURL(/\/studio\/fans$/);
});

test('admin: six sections; a hub card opens its page and the back link returns', async ({
  page,
}) => {
  await signInAsBoard(page);
  await page.goto('/admin');
  await acknowledgeGuidelines(page);
  const sections = page
    .getByRole('tablist', { name: 'Admin sections' })
    .getByRole('tab');
  await expect(sections).toHaveText([
    'Overview',
    'Inbox',
    'People',
    'Content',
    'Co-op',
    'Platform',
  ]);

  await sections.filter({ hasText: 'Platform' }).click();
  await expect(page).toHaveURL(/\/admin\/hubs\/platform$/);
  await page
    .getByRole('list', { name: 'Platform tools' })
    .getByRole('link', { name: /Languages/ })
    .click();
  await expect(page).toHaveURL(/\/admin\/i18n$/);
  await page.getByTestId('admin-hub-back').click();
  await expect(page).toHaveURL(/\/admin\/hubs\/platform$/);
});
