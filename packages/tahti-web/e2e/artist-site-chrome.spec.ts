import { expect, test } from '@playwright/test';

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

for (const mobile of [false, true]) {
  test(`artist subdomain controls and main-site navigation (${mobile ? 'mobile' : 'desktop'})`, async ({
    page,
    baseURL,
  }) => {
    test.skip(!baseURL?.includes('127.0.0.1'), 'Requires the local mock app');
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    );
    await page.route('https://artist-demo.tahti.live/**', async (route) => {
      const url = new URL(route.request().url());
      const response = await route.fetch({
        url: `${baseURL}${url.pathname}${url.search}`,
      });
      await route.fulfill({ response });
    });
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'tahti-mock-channel-visual',
        JSON.stringify({
          topBarText: 'Artist home',
          colorSchemeJson: JSON.stringify({
            bg: '#123456',
            text: '#ffffff',
            accent: '#abcdef',
          }),
        }),
      );
    });
    await page.goto('https://artist-demo.tahti.live/');
    const header = page.getByTestId('artist-site-header');
    await expect(header).toContainText('Artist home');
    await expect(header).toHaveCSS('background-color', 'rgb(18, 52, 86)');
    await expect(page.getByTestId('app-top-nav')).toHaveCount(0);
    await expect(page.getByTestId('sidebar-toggle-left')).toHaveCount(0);
    await expect(page.getByTestId('mobile-bottom-nav')).toHaveCount(0);
    await expect(page.getByTestId('status-bar-content')).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'tahti.live', exact: true }),
    ).toHaveAttribute('href', 'https://tahti.live/');
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'tahti-mock-channel-visual',
        JSON.stringify({
          showSiteSidebar: true,
          showSiteBottomBar: true,
          showSiteHeader: false,
          topBarText: 'Artist home',
        }),
      );
    });
    await page.reload();
    await expect(header).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'tahti.live', exact: true }),
    ).toBeVisible();
    if (mobile) {
      await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible();
      await page
        .getByRole('button', { name: 'Open menu', exact: true })
        .click();
      await expect(page.getByTestId('mobile-drawer')).toBeVisible();
    } else {
      await expect(page.getByTestId('sidebar-toggle-left')).toBeVisible();
    }
    await page.goto('https://artist-demo.tahti.live/?home=1');
    await expect(page.getByTestId('app-top-nav')).toBeVisible();
    if (mobile) {
      await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible();
    } else {
      await expect(page.getByTestId('sidebar-toggle-left')).toBeVisible();
    }
  });
}
