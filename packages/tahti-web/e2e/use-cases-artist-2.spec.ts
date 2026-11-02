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

const main = (page: Page) => page.getByRole('main');

test('artist: schedules a listening party for a release', async ({ page }) => {
  await open(page, '/studio/listening-parties/new');
  const schedule = main(page).getByRole('button', { name: 'Schedule party' });
  await expect(schedule).toBeDisabled();
  await main(page).getByRole('button', { name: 'Release' }).click();
  await page.getByRole('option', { name: /^Neon Tide/ }).click();
  await main(page).getByLabel('Starts').fill('2027-02-20T20:00');
  await expect(schedule).toBeEnabled();
  await schedule.click();
  await expect(page).toHaveURL(/\/studio\/listening-parties(\/|$)/);
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});

test('artist: adds a store price and the empty state goes away', async ({
  page,
}) => {
  await open(page, '/studio/audience?tab=store');
  await expect(
    main(page).getByRole('heading', { name: 'No prices yet' }),
  ).toBeVisible();
  await main(page).getByRole('button', { name: 'New purchase tier' }).click();
  const dialog = page.getByRole('dialog', { name: 'New purchase tier' });
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Single track');
  await dialog.getByRole('button', { name: 'Create tier' }).click();
  await expect(
    main(page).getByRole('heading', { name: 'No prices yet' }),
  ).toHaveCount(0);
  await expect(main(page).getByText('Single track').first()).toBeVisible();
});

test('artist: the store switch shows or hides the Store on the channel', async ({
  page,
}) => {
  await open(page, '/studio/audience?tab=store');
  const toggle = main(page).getByRole('switch', {
    name: 'Show the Store on your channel page',
  });
  const before = await toggle.getAttribute('aria-checked');
  await toggle.click();
  await expect(toggle).not.toHaveAttribute('aria-checked', before ?? '');
});

test('artist: the track editor has Basics, Sharing and Advanced tabs', async ({
  page,
}) => {
  await open(page, '/library/sounds');
  await main(page)
    .getByRole('button', { name: 'Edit Studio sketch A' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Edit track' });
  for (const name of ['Sharing', 'Advanced', 'Basics']) {
    await dialog.getByRole('tab', { name }).click();
    await expect(dialog.getByRole('tab', { name })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  }
  await expect(
    dialog.getByRole('button', { name: 'Save changes' }),
  ).toBeVisible();
});

test('artist: a post with a future time is scheduled, not published', async ({
  page,
}) => {
  const body = `Coming soon ${Date.now()}`;
  await open(page, '/studio/updates');
  await page.getByRole('button', { name: 'New post' }).click();
  const dialog = page.getByRole('dialog', { name: 'New post' });
  await dialog.getByRole('textbox', { name: 'Body' }).fill(body);
  await dialog
    .getByRole('textbox', { name: 'Publish at (optional)' })
    .fill('2027-03-01T10:00');
  await dialog
    .getByRole('button', { name: /Publish|Schedule/ })
    .last()
    .click();
  const row = main(page).getByRole('listitem').filter({ hasText: body });
  await expect(row).toBeVisible();
  await expect(row).toContainText(/2027|Scheduled/);
});

test('artist: Profile → Channel design opens the channel settings', async ({
  page,
}) => {
  await open(page, '/studio/profile');
  await page
    .getByRole('list', { name: 'Channel page settings' })
    .getByRole('link', { name: /Channel design/ })
    .click();
  await expect(page).toHaveURL(/\/settings\/channel\?tab=appearance$/);
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeAttached();
});
