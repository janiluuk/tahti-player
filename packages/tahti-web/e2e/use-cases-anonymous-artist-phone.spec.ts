import { expect, test } from '@playwright/test';

import { STANDARD_VIEWPORTS } from './helpers/viewports';

test('anonymous: the artist page header stays short on a phone', async ({
  page,
}) => {
  await page.setViewportSize(STANDARD_VIEWPORTS.phone);
  await page.goto('/u/northern-lights');

  const main = page.getByRole('main');
  const title = page.getByRole('heading', {
    level: 1,
    name: 'Northern Lights',
  });
  await expect(title).toBeVisible();
  const header = main.getByTestId('artist-social-header');

  const avatar = await header
    .getByTestId('entity-social-header-image')
    .boundingBox();
  const name = await title.boundingBox();
  expect(avatar).not.toBeNull();
  expect(name).not.toBeNull();
  expect(avatar!.width).toBeLessThanOrEqual(64);
  expect(avatar!.x + avatar!.width).toBeLessThanOrEqual(name!.x);
  expect(name!.y).toBeLessThan(avatar!.y + avatar!.height);

  const chips = header.getByTestId('entity-social-stats').locator(':scope > *');
  await expect(chips.first()).toBeVisible();
  const tops = await chips.evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().top)),
  );
  expect(tops.length).toBeGreaterThan(1);
  expect(new Set(tops).size).toBe(1);

  const tracks = main.getByRole('heading', { name: 'Tracks', exact: true });
  await expect(tracks).toBeInViewport();
  const tracksBox = await tracks.boundingBox();
  expect(tracksBox!.y + tracksBox!.height).toBeLessThanOrEqual(
    STANDARD_VIEWPORTS.phone.height,
  );

  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    main: document.querySelector('main')?.scrollWidth ?? 0,
  }));
  expect(overflow.document).toBeLessThanOrEqual(STANDARD_VIEWPORTS.phone.width);
  expect(overflow.main).toBeLessThanOrEqual(STANDARD_VIEWPORTS.phone.width);
});
