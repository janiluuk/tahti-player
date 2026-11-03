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
