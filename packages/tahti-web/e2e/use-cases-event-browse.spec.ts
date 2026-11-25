import { expect, test } from '@playwright/test';

test('an event opened from a row steps to the next and previous event of that row', async ({
  page,
}) => {
  await page.goto('/discover?tab=events');
  const row = page.getByTestId('discover-next-events');
  await expect(row.getByTestId('event-card-title').first()).toBeVisible();
  const titles = (
    await row.getByTestId('event-card-title').allTextContents()
  ).map((title) => title.trim());
  test.skip(titles.length < 2, 'needs at least two upcoming events');
  const [first, second] = titles as [string, string];

  await row.getByTestId('event-card-title').first().click();
  await expect(page).toHaveURL(/\/events\/[^/?]+$/);
  const firstUrl = page.url();
  const eventPage = page.getByTestId('event-page');
  await expect(
    eventPage.getByRole('heading', { name: first, exact: true }).first(),
  ).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Browse events' });
  await expect(nav.getByTestId('event-browse-position')).toHaveText(
    `1 of ${titles.length}`,
  );
  await expect(
    nav.getByRole('button', { name: 'No previous event' }),
  ).toBeDisabled();

  await nav.getByRole('button', { name: `Next event: ${second}` }).click();
  await expect(page).not.toHaveURL(firstUrl);
  await expect(eventPage).toHaveCount(1);
  await expect(
    eventPage.getByRole('heading', { name: second, exact: true }).first(),
  ).toBeVisible();
  await expect(nav.getByTestId('event-browse-position')).toHaveText(
    `2 of ${titles.length}`,
  );

  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(firstUrl);
  await expect(eventPage).toHaveCount(1);
  await expect(
    eventPage.getByRole('heading', { name: first, exact: true }).first(),
  ).toBeVisible();
});
