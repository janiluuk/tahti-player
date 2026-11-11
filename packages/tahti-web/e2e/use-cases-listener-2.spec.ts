import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signInAsListener } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

test('anonymous: a community story opens in a dialog', async ({ page }) => {
  await open(page, '/discover?tab=feed');
  await page
    .getByRole('button', {
      name: 'Read My journey: the story behind the mixes',
    })
    .click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: 'My journey: the story behind the mixes' }),
  ).toBeVisible();
});

test('anonymous: Play all on a release starts its first track', async ({
  page,
}) => {
  await open(page, '/r/night-drive');
  await page.getByRole('button', { name: 'Play all' }).click();
  await expect(page.getByTestId('now-playing-title')).not.toBeEmpty();
});

test.describe('listener', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsListener(page);
  });

  test('likes a track and removes it again', async ({ page }) => {
    await open(page, '/t/northern-lights-archive-1');
    const main = page.getByRole('main');
    await main
      .getByRole('button', { name: 'Like Aurora Drift', exact: true })
      .click();
    await open(page, '/library/favorites');
    await expect(main.getByText('Aurora Drift').first()).toBeVisible();
    await open(page, '/t/northern-lights-archive-1');
    await main
      .getByRole('button', { name: 'Unlike Aurora Drift', exact: true })
      .click();
    await open(page, '/library/favorites');
    await expect(main.getByText('Aurora Drift')).toHaveCount(0);
  });

  test('the Feed lists posts and releases and pages on', async ({ page }) => {
    await open(page, '/discover?tab=feed');
    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', { name: 'Your feed' }),
    ).toBeVisible();
    await expect(main.getByRole('heading', { level: 3 }).first()).toBeVisible();
    await main.getByRole('button', { name: 'Next: Your feed' }).click();
    await expect(
      main.getByRole('button', { name: 'Previous: Your feed' }),
    ).toBeEnabled();
  });

  test('notifications: marking all read clears the unread ones', async ({
    page,
  }) => {
    await open(page, '/notifications');
    const main = page.getByRole('main');
    await expect(
      main.getByRole('button', { name: /^Mark read:/ }).first(),
    ).toBeVisible();
    await main.getByRole('button', { name: 'Mark all read' }).click();
    await expect(main.getByRole('button', { name: /^Mark read:/ })).toHaveCount(
      0,
    );
    await expect(
      main.getByRole('button', { name: 'Clear read' }),
    ).toBeEnabled();
  });

  test('playback settings: a switch keeps its value after a reload', async ({
    page,
  }) => {
    await open(page, '/settings/playback');
    const dialog = page.getByRole('dialog', { name: 'Settings' });
    const keepOn = dialog.getByRole('switch', {
      name: 'Keep the screen on in full screen',
    });
    const before = await keepOn.getAttribute('aria-checked');
    await keepOn.click();
    await expect(keepOn).not.toHaveAttribute('aria-checked', before ?? '');
    const after = await keepOn.getAttribute('aria-checked');
    await page.reload();
    await expect(
      page
        .getByRole('dialog', { name: 'Settings' })
        .getByRole('switch', { name: 'Keep the screen on in full screen' }),
    ).toHaveAttribute('aria-checked', after ?? '');
  });
});
