import { expect, test } from '@playwright/test';

import { signIn, signInAsBoard } from './helpers/auth';

test('artist sends a newsletter draft to subscribers', async ({ page }) => {
  await signIn(page);
  await page.goto('/studio/updates?tab=newsletter');
  const draft = page
    .getByRole('main')
    .getByRole('listitem')
    .filter({ hasText: 'This week on the channel' });
  await draft.getByRole('button', { name: 'Send' }).click();
  await page.getByRole('button', { name: 'Send newsletter' }).click();
  await expect(
    page.getByRole('button', { name: 'Send newsletter' }),
  ).toHaveCount(0);
  await expect(draft.getByText(/sent/i).first()).toBeVisible();
});

test('a moderator bans a chat sender and lifts a ban', async ({ page }) => {
  await signIn(page);
  await page.goto('/moderate/night-drive');
  await page.getByRole('button', { name: 'Ban Promo Bot' }).click();
  await page.getByRole('button', { name: 'Ban', exact: true }).click();
  const bans = page
    .getByRole('heading', { name: 'Chat bans' })
    .locator('xpath=ancestor::section[1]');
  await expect(
    page.getByRole('button', { name: 'Lift the ban on Promo Bot' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Lift the ban on Night Troll' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Lift the ban on Night Troll' }),
  ).toHaveCount(0);
  await expect(bans).toBeVisible();
});

test('board imports a translation CSV for a language', async ({ page }) => {
  await signInAsBoard(page);
  await page.goto('/admin/i18n');
  await page.getByRole('button', { name: 'Import CSV' }).first().click();
  await page.locator('input[type="file"][accept*="csv"]').setInputFiles({
    name: 'fi.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('key,en,translation\nnav.listen,Listen,Kuuntele\n'),
  });
  await expect(page.getByText(/^Imported \d+ rows/)).toBeVisible();
});

test('artist schedules a listening party and cancels it', async ({ page }) => {
  await signIn(page);
  await page.goto('/studio/listening-parties/new');
  const main = page.getByRole('main');
  await main.getByRole('button', { name: 'Release' }).click();
  await page.getByRole('option', { name: /^Neon Tide/ }).click();
  await main.getByLabel('Starts').fill('2027-03-20T20:00');
  await main.getByRole('button', { name: 'Schedule party' }).click();
  await page.goto('/studio/listening-parties');
  await expect(
    main.getByRole('heading', { name: 'No listening parties scheduled' }),
  ).toHaveCount(0);
  await main
    .getByRole('button', { name: /^Cancel/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Cancel party' }).click();
  await expect(page.getByRole('button', { name: 'Cancel party' })).toHaveCount(
    0,
  );
  await expect(
    main.getByRole('heading', { name: 'No listening parties scheduled' }),
  ).toBeVisible();
});

test('an artist removes a listener comment from their channel page', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/channel/artist');
  await page.getByRole('tab', { name: 'Comments' }).click();
  const comments = page.getByTestId('channel-comments');
  const remove = comments.getByRole('button', {
    name: 'Delete comment by Listener One',
  });
  await expect(remove.first()).toBeVisible();
  const before = await remove.count();
  await remove.first().click();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(remove).toHaveCount(before - 1);
});

test('artist publishes a draft release and its smart link page opens', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/releases/rel-mock-3');
  const main = page.getByRole('main');
  await expect(main.getByText('EP · DRAFT')).toBeVisible();
  await main.getByRole('button', { name: 'Publish', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Publish', exact: true })
    .click();
  await expect(main.getByText('EP · PUBLISHED')).toBeVisible();
  await main.getByRole('link', { name: 'Open release embed' }).click();
  await expect(page).toHaveURL(/\/r\/[^/]+$/);
  await expect(
    page.getByRole('heading', { name: /^Studio Sessions Vol/ }).first(),
  ).toBeVisible();
});

test('artist sets a release cover from the artwork presets', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/releases/rel-mock-3?edit=true');
  const header = page.getByTestId('studio-release-social-header');
  const cover = async () =>
    (await header
      .locator('img')
      .first()
      .getAttribute('src', { timeout: 500 })
      .catch(() => null)) ?? '';
  const before = await cover();
  await page
    .getByRole('button', { name: 'Upload Studio Sessions Vol. 1 artwork' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Release artwork' });
  await dialog.getByRole('button', { name: 'Use artwork 3' }).click();
  const apply = page.getByRole('button', { name: 'Use this image' });
  if (await apply.isEnabled().catch(() => false)) {
    await apply.click();
  }
  await expect(
    page.getByRole('button', { name: 'Use this image' }),
  ).toHaveCount(0);
  await expect.poll(cover).not.toBe(before);
});
