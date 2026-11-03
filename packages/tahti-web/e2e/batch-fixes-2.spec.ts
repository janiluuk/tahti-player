import { expect, test } from '@playwright/test';

import { signIn, signInAsBoard } from './helpers/auth';

test('track rows read their counts as text, not a label on a span', async ({
  page,
}) => {
  await page.goto('/u/northern-lights');
  const main = page.getByRole('main');
  await expect(main.getByText(/^\d+ plays$/).first()).toBeAttached();
  await expect(main.locator('span[aria-label$=" plays"]')).toHaveCount(0);
});

test('an unknown address shows Page not found as the page heading', async ({
  page,
}) => {
  await page.goto('/studio/no-such/page');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Page not found' }),
  ).toBeVisible();
});

test('studio lists name their row actions after the item', async ({ page }) => {
  await signIn(page);
  await page.goto('/studio/releases');
  await expect(
    page.getByRole('main').getByRole('button', { name: 'More for Neon Tide' }),
  ).toBeVisible();
  await page.goto('/studio/shows');
  await expect(
    page
      .getByRole('main')
      .getByRole('link', { name: /^Manage / })
      .first(),
  ).toBeVisible();
  await page.goto('/studio/shows/show-series-demo');
  await expect(
    page
      .getByRole('main')
      .getByRole('link', { name: /^(Open|Review) Friday Frequency/ })
      .first(),
  ).toBeVisible();
});

test('admin news and logs name their row buttons', async ({ page }) => {
  await signInAsBoard(page);
  await page.goto('/admin/news');
  await expect(
    page
      .getByRole('main')
      .getByRole('button', { name: /^Delete .+/ })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole('main').getByRole('button', { name: 'Delete', exact: true }),
  ).toHaveCount(0);
  await page.goto('/admin/logs');
  await expect(page.getByTestId('log-copy-button').first()).toHaveAttribute(
    'aria-label',
    /^Copy log: /,
  );
});

test('a release has one Edit details toggle and keeps its title when published', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/studio/releases/rel-mock-3');
  const main = page.getByRole('main');
  await expect(main.getByRole('button', { name: 'Edit details' })).toHaveCount(
    1,
  );
  await main.getByRole('button', { name: 'Publish', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Publish', exact: true })
    .click();
  await expect(main.getByText('EP · PUBLISHED')).toBeVisible();
  await expect(
    main.getByRole('heading', { level: 1, name: 'Studio Sessions Vol. 1' }),
  ).toBeVisible();
});
