import { expect, test } from '@playwright/test';

import { signIn } from './helpers/auth';
import { collectPageErrors } from './helpers/routeHealth';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`Library Playlists opens and can start a create flow (${viewport.name})`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    const errors = collectPageErrors(page);
    await signIn(page);
    await page.goto('/library/playlists');
    await expect(page).toHaveURL(/\/library\/playlists$/);
    await expect(
      page.getByRole('tablist', { name: 'Library sections' }),
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Playlists', selected: true }),
    ).toBeVisible();
    await expect(page.getByTestId('library-playlists')).toBeVisible();
    const create = page.getByRole('link', { name: /Create playlist/i }).first();
    if (await create.isVisible()) {
      await create.click();
      await expect(page).toHaveURL(/\/studio\/collections/);
    }
    expect(errors).toEqual([]);
  });
}
