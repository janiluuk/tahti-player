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

test('admin: the dashboard Health tab links to status checks and Community', async ({
  page,
}) => {
  await open(page, '/admin');
  await expect(page.getByRole('tab', { name: 'Health' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(
    page
      .getByRole('main')
      .getByRole('heading', { level: 2, name: 'System health' }),
  ).toBeVisible();
  await expect(page.getByText('Chat and mail')).toHaveCount(0);
  await page.getByRole('link', { name: 'Status checks' }).click();
  await expect(page).toHaveURL(/\/admin(?:\/)?#status-checks$/);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Status checks' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Community' }).click();
  await expect(page).toHaveURL(/\/admin\/community$/);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Chat and mail' }),
  ).toBeVisible();
});

test('admin: the dashboard tabs keep Jobs, Monitoring and Activity one click away', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await page.route(/grafana\.tahti\.live/, (route) => route.abort());
  await open(page, '/admin');
  const main = page.getByRole('main');
  await main.getByRole('tab', { name: /^Jobs/ }).click();
  await expect(page).toHaveURL(/\/admin\?tab=jobs$/);
  await expect(main.getByRole('list', { name: 'Queue health' })).toBeVisible();
  await main.getByTestId('cron-job-row').first().click();
  await expect(
    page.getByRole('heading', { name: 'nightly-backup runs' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await main.getByRole('tab', { name: 'Monitoring' }).click();
  await expect(page).toHaveURL(/\/admin\?tab=monitoring$/);
  await expect(main.getByTestId('grafana-embed-fallback')).toBeVisible();
  await expect(
    main.getByRole('link', { name: /Open Grafana/ }).first(),
  ).toHaveAttribute('href', /^https:\/\/grafana\.tahti\.live\/d\//);
  await main.getByRole('tab', { name: /^Activity/ }).click();
  await expect(page).toHaveURL(/\/admin\?tab=activity$/);
  await expect(
    main.getByRole('heading', { level: 2, name: 'Needs action' }),
  ).toBeVisible();
  await page.goto('/admin#queues');
  await expect(
    page.getByRole('main').getByRole('tab', { name: /^Jobs/, selected: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
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
  await expect(people.filter({ hasNotText: /board/i })).toHaveCount(0);
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
