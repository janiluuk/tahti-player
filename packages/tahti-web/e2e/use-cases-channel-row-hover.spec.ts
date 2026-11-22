import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines } from './helpers/auth';

const CHANNEL = '/channel/yaniho';

const trackRow = (page: Page, volume: number) =>
  page.getByTestId('ambient-track-row').filter({
    has: page.getByRole('heading', {
      name: `Moody Electronica vol. ${volume}`,
      exact: true,
    }),
  });

const playControl = (page: Page, volume: number) =>
  trackRow(page, volume).getByTestId('media-artwork-play');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(CHANNEL);
  await acknowledgeGuidelines(page);
  await expect(playControl(page, 40)).toBeAttached();
});

test('anonymous: hovering a channel track row reveals only that row’s play control', async ({
  page,
}) => {
  await expect(playControl(page, 40)).toHaveCSS('opacity', '0');
  await expect(playControl(page, 39)).toHaveCSS('opacity', '0');

  await trackRow(page, 40).hover();
  await expect(playControl(page, 40)).toHaveCSS('opacity', '1');
  await expect(playControl(page, 39)).toHaveCSS('opacity', '0');

  await trackRow(page, 39).hover();
  await expect(playControl(page, 39)).toHaveCSS('opacity', '1');
  await expect(playControl(page, 40)).toHaveCSS('opacity', '0');
});

test('anonymous: Shift+click on a row’s play control queues the track without playing it', async ({
  page,
}) => {
  await trackRow(page, 39).hover();
  await playControl(page, 39).click({ modifiers: ['Shift'] });

  await expect(
    trackRow(page, 39).getByRole('button', {
      name: 'In queue: Moody Electronica vol. 39',
    }),
  ).toBeDisabled();
  await expect(playControl(page, 39)).not.toHaveAttribute(
    'data-current',
    'true',
  );
  await expect(page.getByRole('button', { name: /^Pause / })).toHaveCount(0);
  await expect(
    trackRow(page, 40).getByRole('button', {
      name: 'Queue Moody Electronica vol. 40',
    }),
  ).toBeEnabled();
});
