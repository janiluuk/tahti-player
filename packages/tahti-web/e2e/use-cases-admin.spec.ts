import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signInAsBoard } from './helpers/auth';
import { collectPageErrors } from './helpers/routeHealth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsBoard(page);
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

test('admin: Inbox chips switch queues and keep the URL in step', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await open(page, '/admin/moderation/beta');
  const queues = page.getByRole('radiogroup', { name: 'Inbox queues' });
  await expect(
    queues.getByRole('radio', { name: /^Beta applications/ }),
  ).toHaveAttribute('aria-checked', 'true');
  await queues.getByRole('radio', { name: /^Support/ }).click();
  await expect(page).toHaveURL(/\/admin\/moderation\/support$/);
  await queues.getByRole('radio', { name: 'Themes' }).click();
  await expect(page).toHaveURL(/\/admin\/moderation\/themes$/);
  expect(errors).toEqual([]);
});

test('admin: approving a beta application takes it off the queue', async ({
  page,
}) => {
  await open(page, '/admin/moderation/beta');
  const approve = page.getByRole('main').getByRole('button', {
    name: 'Approve',
    exact: true,
  });
  await expect(approve.first()).toBeVisible();
  const before = await approve.count();
  await approve.first().click();
  await expect(approve).toHaveCount(before - 1);
});

test('admin: People shows the account picked from the list', async ({
  page,
}) => {
  await open(page, '/admin/users');
  await page
    .getByRole('main')
    .getByRole('radio', { name: /^Listener One/ })
    .click();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Listener One' }),
  ).toBeVisible();
});

test('admin: publishes a news post', async ({ page }) => {
  const headline = `Board update ${Date.now()}`;
  await open(page, '/admin/news');
  await page.getByRole('button', { name: 'Write post' }).click();
  const dialog = page.getByRole('dialog', { name: 'Write a news post' });
  await dialog.getByRole('textbox', { name: 'Headline' }).fill(headline);
  await dialog
    .getByRole('textbox', { name: 'Short summary' })
    .fill('What the board decided this week.');
  await dialog.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByRole('main').getByText(headline)).toBeVisible();
});

test('admin: the dashboard leads with health and links to status checks', async ({
  page,
}) => {
  await open(page, '/admin');
  const headings = page.getByRole('main').getByRole('heading', { level: 2 });
  await expect(headings.first()).toHaveText('System health');
  await page.getByRole('link', { name: 'Status checks' }).click();
  await expect(page).toHaveURL(/\/admin\/status$/);
});

test('admin: People filters by role', async ({ page }) => {
  await open(page, '/admin/users');
  await page.getByRole('button', { name: 'Filter by role' }).click();
  await page.getByRole('option', { name: 'Board' }).click();
  const people = page
    .getByRole('main')
    .getByRole('radio')
    .filter({ hasText: '@' });
  await expect(people.first()).toBeVisible();
  for (const label of await people.allInnerTexts()) {
    expect(label).toMatch(/board/i);
  }
});

test('admin: Announcements opens from the Content hub and links back', async ({
  page,
}) => {
  await open(page, '/admin/hubs/content');
  await page
    .getByRole('list', { name: 'Content tools' })
    .getByRole('link', { name: /Announcements/ })
    .click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Announcements' }),
  ).toBeVisible();
  await page.getByTestId('admin-hub-back').click();
  await expect(page).toHaveURL(/\/admin\/hubs\/content$/);
});
