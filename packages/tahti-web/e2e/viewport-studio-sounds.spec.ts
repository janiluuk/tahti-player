import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';
import {
  STANDARD_VIEWPORTS,
  type StandardViewportName,
} from './helpers/viewports';

test('library + studio sounds stay reachable across desktop, tablet, and phone', async ({
  page,
}) => {
  await signIn(page);
  for (const [name, viewport] of Object.entries(STANDARD_VIEWPORTS) as Array<
    [StandardViewportName, { width: number; height: number }]
  >) {
    await page.setViewportSize(viewport);
    await page.goto('/library');
    await expect(
      page.locator('[data-testid="sidebar-navigation"]').first(),
    ).toBeVisible();
    const libraryOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(libraryOverflow, `library overflow @ ${name}`).toBeLessThanOrEqual(
      1,
    );

    await page.goto('/studio/sounds');
    await expect(page.getByRole('heading', { name: /^Sounds$/ })).toBeVisible();
    await expect(page.locator('[data-studio-shell]').first()).toBeVisible();
    if (name === 'phone') {
      await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible();
    } else {
      await expect(
        page.locator('[data-studio-navigation]').first(),
      ).toBeVisible();
    }
    const studioOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(
      studioOverflow,
      `studio sounds overflow @ ${name}`,
    ).toBeLessThanOrEqual(1);
  }
});
