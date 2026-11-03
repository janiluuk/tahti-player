import { expect, test } from '@playwright/test';

test('anonymous: a Jam invite link asks to log in', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/jam/abc123');
  const dialog = page.getByRole('dialog', { name: 'Log in' });
  await expect(dialog.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Join' })).toBeVisible();
});

test('anonymous: commenting on a track asks to log in', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/t/demo-archive-1');
  const main = page.getByRole('main');
  await expect(
    main.getByRole('heading', { level: 2, name: 'Comments' }),
  ).toBeVisible();
  await expect(
    main.getByRole('textbox', { name: 'Write a comment' }),
  ).toHaveCount(0);
  await main.getByRole('button', { name: 'Comment at 0:00' }).click();
  await main
    .getByRole('link', { name: 'Log in to write a comment at 0:00' })
    .click();
  await expect(
    page
      .getByRole('dialog', { name: 'Log in' })
      .getByRole('textbox', { name: 'Email' }),
  ).toBeVisible();
});

test('anonymous on a phone: the bottom nav and More drawer reach Library', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const bottomNav = page.getByTestId('mobile-bottom-nav');
  await expect(bottomNav.getByRole('link', { name: 'Listen' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(bottomNav.getByRole('link', { name: 'Studio' })).toHaveCount(0);
  await bottomNav.getByRole('button', { name: 'More' }).click();
  const drawer = page.getByTestId('mobile-drawer');
  await drawer.getByRole('link', { name: 'Library' }).first().click();
  await expect(page).toHaveURL(/\/library/);
  await expect(page.getByTestId('mobile-drawer')).toHaveCount(0);
  await expect(bottomNav).toBeVisible();
});
