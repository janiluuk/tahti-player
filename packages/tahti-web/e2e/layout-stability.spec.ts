import { expect, test } from '@playwright/test';

import { E2E_EMAIL, E2E_PASSWORD } from './helpers/auth';

const studioRoutes = [
  '/studio',
  '/studio/releases',
  '/studio/editor',
  '/studio/go-live',
  '/studio/schedule',
  '/studio/events',
  '/studio/shows',
  '/studio/channel',
] as const;

const adminRoutes = [
  '/admin',
  '/admin/logs',
  '/admin/monitoring',
  '/admin/status',
  '/admin/moderation',
  '/admin/tahti-selects',
  '/admin/users',
  '/admin/governance',
  '/admin/grants',
  '/admin/agm',
  '/admin/missed-shows',
  '/admin/top-lists',
  '/admin/radio',
  '/admin/news',
  '/admin/announcements',
  '/admin/streams',
  '/admin/storage',
  '/admin/financial',
  '/admin/vendors',
  '/admin/i18n',
] as const;

async function signIn(
  page: import('@playwright/test').Page,
  board = false,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(E2E_EMAIL);
  await page.getByLabel('Password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.evaluate((shouldSetBoard) => {
    const raw = localStorage.getItem('tahti-web-auth');
    const userId = raw ? JSON.parse(raw)?.state?.user?.id : null;
    if (typeof userId === 'string') {
      localStorage.setItem(`tahti-web-onboarded:${userId}`, '1');
    }
    if (shouldSetBoard && raw) {
      const auth = JSON.parse(raw);
      const user = auth.state?.user;
      if (user) {
        user.role = 'BOARD';
        user.roles = ['BOARD', 'ARTIST'];
        user.isBoard = true;
        localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
      }
    }
  }, board);
  await page.reload();
}

async function expectStableShell(
  page: import('@playwright/test').Page,
  routes: readonly string[],
  shellSelector: string,
  tabsSelector: string,
  menuSelector: string,
): Promise<void> {
  let baseline:
    | {
        shellLeft: number;
        menuLeft: number;
        contentLeft: number;
      }
    | undefined;

  for (const route of routes) {
    await page.goto(route);
    await page.waitForTimeout(500);
    const shell = page.locator(shellSelector).first();
    await expect(shell).toBeVisible();
    await expect(shell.locator(tabsSelector).first()).toBeVisible();
    await expect(shell.locator(menuSelector).first()).toBeVisible();

    const geometry = await shell.evaluate(
      (element, selectors) => {
        const shellRect = element.getBoundingClientRect();
        const menu = element.querySelector(selectors.menu);
        const tabs = element.querySelector(selectors.tabs);
        const content = Array.from(element.children).find(
          (child) => child !== menu && child !== tabs,
        );
        return {
          shellLeft: shellRect.left,
          menuLeft: menu?.getBoundingClientRect().left ?? -1,
          contentLeft: content?.getBoundingClientRect().left ?? -1,
        };
      },
      { menu: menuSelector, tabs: tabsSelector },
    );

    if (!baseline) {
      baseline = geometry;
      continue;
    }

    expect(geometry.menuLeft - geometry.shellLeft, route).toBeCloseTo(
      baseline.menuLeft - baseline.shellLeft,
      0,
    );
    expect(geometry.contentLeft - geometry.shellLeft, route).toBeCloseTo(
      baseline.contentLeft - baseline.shellLeft,
      0,
    );
  }
}

test('Studio shell stays full-width and keeps navigation geometry stable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await expectStableShell(
    page,
    studioRoutes,
    '[data-studio-shell]',
    '[data-studio-navigation]',
    '[data-studio-navigation]',
  );
});

test('Admin shell stays full-width and keeps navigation geometry stable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page, true);
  await expectStableShell(
    page,
    adminRoutes,
    '.admin-page-layout, .admin-moderation-layout',
    '[data-admin-section-tabs]',
    '[data-admin-section-menu]',
  );
});

test('Studio and Admin shells remain reachable on mobile without horizontal overflow', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });

  await signIn(page);
  for (const route of studioRoutes) {
    await page.goto(route);
    await page.waitForTimeout(500);
    const shell = page.locator('[data-studio-shell]').first();
    await expect(shell).toBeVisible();
    await expect(
      shell.locator('[data-studio-navigation]').first(),
    ).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(dimensions.documentWidth, route).toBeLessThanOrEqual(
      dimensions.viewport,
    );
    expect(dimensions.bodyWidth, route).toBeLessThanOrEqual(
      dimensions.viewport,
    );
  }

  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    if (!raw) {
      return;
    }
    const auth = JSON.parse(raw);
    const user = auth.state?.user;
    if (user) {
      user.role = 'BOARD';
      user.roles = ['BOARD', 'ARTIST'];
      user.isBoard = true;
      localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
    }
  });
  await page.reload();
  for (const route of adminRoutes) {
    await page.goto(route);
    await page.waitForTimeout(500);
    const shell = page
      .locator('.admin-page-layout, .admin-moderation-layout')
      .first();
    await expect(shell).toBeVisible();
    await expect(
      shell.locator('[data-admin-section-tabs]').first(),
    ).toBeVisible();
    await expect(
      shell.locator('[data-admin-section-menu]').first(),
    ).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(dimensions.documentWidth, route).toBeLessThanOrEqual(
      dimensions.viewport,
    );
    expect(dimensions.bodyWidth, route).toBeLessThanOrEqual(
      dimensions.viewport,
    );
  }
});
