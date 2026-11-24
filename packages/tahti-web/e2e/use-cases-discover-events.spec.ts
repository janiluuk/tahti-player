import { expect, test, type Locator, type Page } from '@playwright/test';

async function startTimes(cards: Locator): Promise<number[]> {
  const values = await cards
    .getByTestId('event-card-start')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('datetime') ?? ''),
    );
  return values.map((value) => new Date(value).getTime());
}

async function opensFirstEvent(page: Page, cards: Locator): Promise<void> {
  const title = cards.getByTestId('event-card-title').first();
  const name = (await title.textContent())!.trim();
  await title.click();
  await expect(page).toHaveURL(/\/events\/[^/?]+/);
  await expect(page.getByTestId('event-page')).toBeVisible();
  await expect(
    page.getByRole('heading', { name, exact: true }).first(),
  ).toBeVisible();
}

test('Discover → Events opens with the next events first, soonest first', async ({
  page,
}) => {
  await page.goto('/discover?tab=events');
  const panel = page.getByTestId('discover-events');
  const next = panel.getByTestId('discover-next-events');
  await expect(next).toBeVisible();
  await expect(next.getByTestId('event-card-start').first()).toBeVisible();

  const times = await startTimes(next);
  expect(times.length).toBeGreaterThan(0);
  expect(times.every((time) => !Number.isNaN(time))).toBe(true);
  expect(times).toEqual([...times].sort((a, b) => a - b));

  const list = panel.getByTestId('discover-events-list');
  await expect(list).toBeVisible();
  const nextBox = (await next.boundingBox())!;
  const listBox = (await list.boundingBox())!;
  expect(nextBox.y + nextBox.height).toBeLessThanOrEqual(listBox.y);

  await opensFirstEvent(page, next);
});

test('Discover shows the Upcoming events widget and a card opens the event', async ({
  page,
}) => {
  await page.goto('/discover');
  const strip = page.getByTestId('upcoming-events');
  await strip.scrollIntoViewIfNeeded();
  await expect(strip).toBeVisible();
  await expect(strip).toHaveAccessibleName(/^Upcoming events/);
  await expect(strip.getByTestId('event-card-title').first()).toBeVisible();
  const times = await startTimes(strip);
  expect(times).toEqual([...times].sort((a, b) => a - b));

  await opensFirstEvent(page, strip);
});
