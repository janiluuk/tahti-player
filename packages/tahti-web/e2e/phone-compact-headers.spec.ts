import { expect, test } from '@playwright/test';

import { STANDARD_VIEWPORTS } from './helpers/viewports';

const PAGES = [
  {
    name: 'collection',
    path: '/u/northern-lights/c/northern-lights-open-crate',
    header: 'collection-social-header',
  },
  { name: 'venue', path: '/v/kuudes-linja', header: 'venue-social-header' },
  {
    name: 'radio show',
    path: '/radio/show/northern-lights',
    header: 'radio-show-social-header',
  },
] as const;

for (const { name, path, header: headerTestId } of PAGES) {
  test(`phone: the ${name} page shows the compact header`, async ({ page }) => {
    await page.setViewportSize(STANDARD_VIEWPORTS.phone);
    await page.goto(path);

    const header = page.getByRole('main').getByTestId(headerTestId);
    const title = header.getByRole('heading', { level: 1 });
    await expect(title).toBeVisible();

    const avatar = await header
      .getByTestId('entity-social-header-image')
      .boundingBox();
    const titleBox = await title.boundingBox();
    expect(avatar).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(avatar!.width).toBeLessThanOrEqual(64);
    expect(avatar!.x + avatar!.width).toBeLessThanOrEqual(titleBox!.x);
    expect(titleBox!.y).toBeLessThan(avatar!.y + avatar!.height);
    expect(avatar!.y).toBeLessThan(titleBox!.y + titleBox!.height);

    const overflow = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      main: document.querySelector('main')?.scrollWidth ?? 0,
    }));
    expect(overflow.document).toBeLessThanOrEqual(
      STANDARD_VIEWPORTS.phone.width,
    );
    expect(overflow.main).toBeLessThanOrEqual(STANDARD_VIEWPORTS.phone.width);
  });
}
