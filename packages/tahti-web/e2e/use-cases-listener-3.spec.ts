import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signInAsListener } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsListener(page);
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

test('listener: starts a Jam from a playlist and lands in the session', async ({
  page,
}) => {
  await open(page, '/u/liina/c/night-drives');
  await page.getByRole('button', { name: 'Start a Jam' }).click();
  await expect(page).toHaveURL(/\/jam\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});

test('listener: comments on a channel page', async ({ page }) => {
  const text = `Great set tonight ${Date.now()}`;
  await open(page, '/channel/northern-lights');
  await page.getByRole('tab', { name: 'Comments' }).click();
  const box = page.getByRole('textbox', { name: 'Write a comment' });
  await box.fill(text);
  await box.press('Enter');
  await expect(page.getByText(text).first()).toBeVisible();
});

test('listener: listening stats and the history list switch tabs', async ({
  page,
}) => {
  await open(page, '/listen/history');
  const main = page.getByRole('main');
  await expect(main.getByRole('tab', { name: 'Stats' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await main.getByRole('tab', { name: 'Listening history' }).click();
  await expect(
    main.getByRole('tab', { name: 'Listening history' }),
  ).toHaveAttribute('aria-selected', 'true');
});

test('listener: the avatar dot clears after marking notifications read', async ({
  page,
}) => {
  await open(page, '/');
  const pill = page.getByTestId('account-unread-pill');
  await expect(pill).toBeVisible();
  const dots = pill.locator(':scope > *');
  const before = await dots.count();
  await open(page, '/notifications');
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Mark all read' })
    .click();
  await open(page, '/');
  await expect
    .poll(async () => ((await pill.isVisible()) ? await dots.count() : 0))
    .toBeLessThan(before);
});
