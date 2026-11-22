import { expect, test, type Page } from '@playwright/test';

import {
  acknowledgeGuidelines,
  signIn,
  signInAsListener,
} from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

test('listener: hides a Listen section, it stays hidden, Reset brings it back', async ({
  page,
}) => {
  await signInAsListener(page);
  await open(page, '/');
  const dashboard = page.getByTestId('listen-dashboard');
  const trending = dashboard.getByRole('heading', {
    name: 'Trending this week',
  });
  await expect(trending).toBeVisible();

  await page.getByTestId('listen-order-toggle').click();
  await dashboard.getByRole('button', { name: 'Remove Trending' }).click();
  const confirm = page.getByRole('dialog');
  await confirm.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(trending).toHaveCount(0);

  await page.reload();
  await expect(
    dashboard.getByRole('heading', { name: 'New releases' }),
  ).toBeVisible();
  await expect(trending).toHaveCount(0);

  await page.getByTestId('listen-reset-widgets').click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Reset widgets' })
    .click();
  await expect(trending).toBeVisible();
});

test('artist: Studio → Profile → Identity saves a creative role and city', async ({
  page,
}) => {
  await signIn(page);
  await open(page, '/studio/profile/identity');
  const identity = () => page.getByTestId('studio-profile-section-identity');
  await identity().getByRole('checkbox', { name: 'DJ', exact: true }).click();
  await identity()
    .getByRole('textbox', { name: 'City / location' })
    .fill('Tampere');
  await identity().getByRole('button', { name: 'Save identity' }).click();
  await expect(page.getByText('Artist info saved.')).toBeVisible();

  // The mock API keeps the profile in memory, so leave and come back inside
  // the app instead of reloading.
  await page.getByTestId('page-back-link').click();
  await expect(page).toHaveURL(/\/studio\/profile$/);
  await page
    .getByRole('list', { name: 'Artist profile settings' })
    .getByRole('link', { name: /Identity/ })
    .click();
  await expect(
    identity().getByRole('checkbox', { name: 'DJ', exact: true }),
  ).toBeChecked();
  await expect(identity().getByText('Selected: DJ')).toBeVisible();
  await expect(
    identity().getByRole('textbox', { name: 'City / location' }),
  ).toHaveValue('Tampere');
});

test('artist: moves a Discover widget later and the order sticks', async ({
  page,
}) => {
  await signIn(page);
  await open(page, '/discover');
  // The widgets sit in a masonry, so DOM order is not list order; the first
  // widget is the one whose Move earlier is disabled.
  const columns = page.getByTestId('discover-widget-columns');
  const mostPlayed = columns
    .getByRole('heading', { name: 'This week: most played' })
    .locator('xpath=ancestor::*[.//button[@aria-label="Move later"]][1]');
  const moveEarlier = mostPlayed.getByRole('button', { name: 'Move earlier' });
  await expect(moveEarlier).toBeDisabled();

  await mostPlayed.getByRole('button', { name: 'Move later' }).click();
  await expect(moveEarlier).toBeEnabled();

  await page.reload();
  await expect(moveEarlier).toBeEnabled();
});

test('anonymous: favorites a radio station and it stays after a reload', async ({
  page,
}) => {
  await open(page, '/radio');
  const main = page.getByRole('main');
  const favorites = main.getByRole('heading', { name: 'Favorite stations' });
  await expect(favorites).toHaveCount(0);
  await main
    .getByRole('button', { name: 'Favorite YleX', exact: true })
    .click();
  await expect(favorites).toBeVisible();
  await expect(
    main.getByRole('button', { name: 'Remove YleX from favorites' }),
  ).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(favorites).toBeVisible();
  await main
    .getByRole('button', { name: 'Remove YleX from favorites' })
    .click();
  await expect(favorites).toHaveCount(0);
});
