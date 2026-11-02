import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signIn } from './helpers/auth';
import { collectPageErrors } from './helpers/routeHealth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

test('artist: publishes a post and sees it in the list', async ({ page }) => {
  const errors = collectPageErrors(page);
  const body = `Studio diary ${Date.now()}`;
  await open(page, '/studio/updates');
  await page.getByRole('button', { name: 'New post' }).click();
  const dialog = page.getByRole('dialog', { name: 'New post' });
  await dialog.getByRole('textbox', { name: 'Body' }).fill(body);
  await dialog.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByRole('main').getByText(body)).toBeVisible();
  expect(errors).toEqual([]);
});

test('artist: creates a membership tier', async ({ page }) => {
  const name = `Backstage ${Date.now()}`;
  await open(page, '/studio/audience?tab=tiers');
  await page.getByRole('button', { name: 'New tier' }).click();
  const dialog = page.getByRole('dialog', { name: 'New tier' });
  await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
  await dialog.getByRole('textbox', { name: 'Price (€ / month)' }).fill('7');
  await dialog.getByRole('button', { name: 'Create tier' }).click();
  await expect(page.getByRole('main').getByText(name)).toBeVisible();
});

test('artist: Broadcast agenda chips filter the Coming up list', async ({
  page,
}) => {
  await open(page, '/studio/broadcast');
  const filter = page.getByRole('radiogroup', { name: 'Agenda filter' });
  await expect(filter.getByRole('radio', { name: 'All' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await filter.getByRole('radio', { name: 'Events' }).click();
  const rows = page.getByTestId('broadcast-agenda-row');
  for (const text of await rows.allInnerTexts()) {
    expect(text).toMatch(/^Event/);
  }
  await filter.getByRole('radio', { name: 'Parties' }).click();
  for (const text of await rows.allInnerTexts()) {
    expect(text).toMatch(/^(Party|Live)/);
  }
});

test('artist: Go live opens from the Broadcast hub and links back', async ({
  page,
}) => {
  await open(page, '/studio/broadcast');
  await page.getByRole('main').getByRole('link', { name: 'Go live' }).click();
  await expect(page).toHaveURL(/\/studio\/go-live/);
  await page.getByTestId('studio-broadcast-back').click();
  await expect(page).toHaveURL(/\/studio\/broadcast$/);
});

test('artist: release detail has four tabs and each opens', async ({
  page,
}) => {
  await open(page, '/studio/releases');
  await page
    .getByRole('main')
    .getByRole('link', { name: 'After Hours', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'After Hours' }),
  ).toBeVisible();
  for (const name of ['Links', 'Stats', 'Advanced', 'Overview']) {
    const tab = page.getByRole('tab', { name, exact: true }).last();
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  }
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});

test('artist: the Stats range picker switches ranges', async ({ page }) => {
  await open(page, '/studio/stats');
  const range = page.getByRole('radiogroup', { name: 'Stats time range' });
  await range.getByRole('radio', { name: '7 days' }).click();
  await expect(range.getByRole('radio', { name: '7 days' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await range.getByRole('radio', { name: 'All time' }).click();
  await expect(range.getByRole('radio', { name: 'All time' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});

test('artist: adds an event and finds it under Events', async ({ page }) => {
  const title = `Rooftop set ${Date.now()}`;
  await open(page, '/studio/events/new');
  await page.getByRole('textbox', { name: 'Title' }).fill(title);
  await page.getByRole('textbox', { name: 'Place' }).fill('Kaiku');
  await page.getByRole('textbox', { name: 'Location' }).fill('Helsinki');
  await page.getByLabel('Start').fill('2027-01-15T21:00');
  await page.getByRole('button', { name: 'Add event' }).click();
  await expect(page).toHaveURL(/\/studio\/events$/);
  await expect(page.getByRole('main').getByText(title)).toBeVisible();
});

test('artist: the Store page and the Newsletter page open from Fans', async ({
  page,
}) => {
  await open(page, '/studio/fans');
  const tools = page.getByRole('list', { name: 'Fans tools' });
  await tools.getByRole('link', { name: /Store/ }).click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Channel store' }),
  ).toBeVisible();
  await page.getByTestId('studio-fans-back').click();
  await tools.getByRole('link', { name: /Newsletter/ }).click();
  await expect(page).toHaveURL(/\/studio\/updates\?tab=newsletter$/);
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});
