import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signIn } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

test('artist: Go live reaches the green room, invites a guest and opens it', async ({
  page,
}) => {
  await open(page, '/studio/broadcast');
  const main = page.getByRole('main');
  await main.getByRole('link', { name: 'Go live' }).click();
  await expect(page).toHaveURL(/\/studio\/go-live$/);
  await main
    .getByRole('tablist', { name: 'Go live session' })
    .getByRole('tab', { name: 'Green room' })
    .click();
  await expect(page).toHaveURL(/\/studio\/go-live\?tab=green-room$/);
  await expect(main.getByRole('heading', { name: 'Green room' })).toBeVisible();

  const openRoom = main.getByRole('switch', { name: 'Open the green room' });
  await expect(openRoom).not.toBeChecked();
  await openRoom.click();
  await expect(openRoom).toBeChecked();
  await expect(
    main.getByText(/Guests join at .*\/u\/artist\/green-room/),
  ).toBeVisible();

  const guest = `guest${Date.now()}`;
  const handle = main.getByRole('textbox', { name: 'Invite by handle' });
  const invite = main.getByRole('button', { name: 'Invite', exact: true });
  await expect(invite).toBeDisabled();
  await handle.fill(guest);
  await invite.click();
  await expect(
    main.getByRole('button', { name: `Remove ${guest}` }),
  ).toBeVisible();

  await main.getByRole('link', { name: 'Open Green Room chat' }).click();
  await expect(page).toHaveURL(/\/u\/artist\/green-room$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Green room' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Play preview stream' }),
  ).toBeVisible();
});

test('artist: starts a Jam from their own playlist, hosts it and ends it', async ({
  page,
}) => {
  await open(page, '/u/artist/c/favorites-mix');
  await page.getByRole('button', { name: 'Start a Jam' }).click();
  await expect(page).toHaveURL(/\/jam\/[^/]+$/);
  const main = page.getByRole('main');
  await expect(
    main.getByRole('heading', { level: 1, name: 'Tahti Jam' }),
  ).toBeVisible();
  await expect(
    main.getByRole('listitem').filter({ hasText: 'Host' }),
  ).toContainText('artist');
  await main.getByRole('button', { name: 'End Jam for everyone' }).click();
  await expect(
    main.getByRole('button', { name: 'End Jam for everyone' }),
  ).toHaveCount(0);
});

test('artist: Admin asks for a board account', async ({ page }) => {
  await open(page, '/admin');
  await expect(
    page.getByRole('heading', { name: 'Board access required' }),
  ).toBeVisible();
  await expect(
    page.getByRole('tablist', { name: 'Admin sections' }),
  ).toHaveCount(0);
});
