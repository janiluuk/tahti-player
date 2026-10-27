import { expect, test, type Page } from '@playwright/test';

import { signIn } from './helpers/auth';
import { collectPageErrors } from './helpers/routeHealth';

const SHELL = '[data-testid="listen-shell"]';
const TOP_NAV = '[data-testid="app-top-nav"]';
const SIDEBAR = '[data-testid="sidebar-navigation"]';
const STUDIO_NAV = '[data-testid="studio-navigation"]';
const ADMIN_SHELL = '[data-admin-shell]';
const BOTTOM_NAV = '[data-testid="mobile-bottom-nav"]';
const DRAWER = '[data-testid="mobile-drawer"]';

async function expectChrome(page: Page, selectors: string[]): Promise<void> {
  for (const selector of selectors) {
    await expect(page.locator(selector).first(), selector).toBeVisible();
  }
}

async function promoteToBoard(page: Page): Promise<void> {
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

test('desktop chrome stays mounted from Listen through Library, Studio and Admin', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = collectPageErrors(page);
  await signIn(page);

  await page.goto('/');
  await expectChrome(page, [SHELL, TOP_NAV, SIDEBAR]);

  const sidebar = page.locator(SIDEBAR).first();
  await sidebar.getByRole('link', { name: 'Studio' }).first().click();
  await expect(page).toHaveURL(/\/studio$/);
  await expectChrome(page, [SHELL, TOP_NAV, SIDEBAR, STUDIO_NAV]);

  // A sticky policy notice can sit over the Studio tabs at the top of the
  // screen until it is acknowledged, so the tab is chosen by keyboard.
  await page
    .locator(STUDIO_NAV)
    .getByRole('tab', { name: 'Releases', exact: true })
    .press('Enter');
  await expect(page).toHaveURL(/\/studio\/releases$/);
  await expectChrome(page, [SHELL, TOP_NAV, SIDEBAR, STUDIO_NAV]);
  await expect(
    page
      .locator(STUDIO_NAV)
      .getByRole('tab', { name: 'Releases', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');

  await promoteToBoard(page);
  await page.goto('/admin');
  await expectChrome(page, [SHELL, TOP_NAV, SIDEBAR, ADMIN_SHELL]);
  await expect(page.locator(STUDIO_NAV)).toHaveCount(0);

  await page.goto('/library/collections');
  await expectChrome(page, [SHELL, TOP_NAV, SIDEBAR]);
  await expect(page.locator(BOTTOM_NAV)).toBeHidden();
  expect(errors).toEqual([]);
});

test('mobile bottom nav and drawer move between sections', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = collectPageErrors(page);
  await signIn(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await expectChrome(page, [SHELL, TOP_NAV, BOTTOM_NAV]);
  const bottomNav = page.locator(BOTTOM_NAV);
  await expect(bottomNav.getByRole('link', { name: 'Listen' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await bottomNav.getByRole('link', { name: 'Studio' }).click();
  await expect(page).toHaveURL(/\/studio$/);
  await expectChrome(page, [SHELL, TOP_NAV, BOTTOM_NAV, STUDIO_NAV]);
  await expect(bottomNav.getByRole('link', { name: 'Studio' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await bottomNav.getByRole('button', { name: 'More' }).click();
  const drawer = page.locator(DRAWER).filter({ hasText: 'Navigate' });
  await expect(drawer).toBeVisible();
  await expect(bottomNav.getByRole('button', { name: 'More' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await drawer.getByRole('link', { name: 'Library' }).first().click();
  await expect(page.locator(DRAWER)).toHaveCount(0);
  await expect(page).toHaveURL(/\/library/);
  await expectChrome(page, [SHELL, TOP_NAV, BOTTOM_NAV]);
  await expect(page.locator(STUDIO_NAV)).toHaveCount(0);
  expect(errors).toEqual([]);
});
