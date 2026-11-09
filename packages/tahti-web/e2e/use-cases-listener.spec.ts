import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signInAsListener } from './helpers/auth';
import { collectPageErrors } from './helpers/routeHealth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsListener(page);
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

test('listener: follows an artist and finds them under Library → Following', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await open(page, '/u/demo');
  await page.getByRole('button', { name: 'Follow demo' }).click();
  await expect(
    page.getByRole('button', { name: /Unfollow demo|Following/ }),
  ).toBeVisible();
  await open(page, '/library/following');
  await expect(
    page.getByTestId('library-following').getByRole('link', { name: /demo/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('listener: likes a track and finds it in Favorites', async ({ page }) => {
  await open(page, '/t/demo-archive-2');
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Favorite Archive Session 02', exact: true })
    .click();
  await open(page, '/library/favorites');
  await expect(
    page.getByRole('main').getByText('Archive Session 02').first(),
  ).toBeVisible();
});

test('listener: creates a playlist from a track and finds it in Library', async ({
  page,
}) => {
  const name = `Road mix ${Date.now()}`;
  await open(page, '/u/demo');
  await page
    .getByRole('button', { name: 'Add Midnight Broadcast to a playlist' })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: 'Add to playlist' });
  await dialog.getByRole('button', { name: 'Create new playlist' }).click();
  await dialog.getByRole('textbox').first().fill(name);
  await dialog.getByRole('textbox').first().press('Enter');
  await expect(page.getByText(name).first()).toBeVisible();
});

test('listener: leaves a timed comment on a track', async ({ page }) => {
  const text = `Lovely build ${Date.now()}`;
  await open(page, '/t/demo-archive-1');
  await page.getByRole('button', { name: 'Comment at 0:00' }).click();
  const box = page.getByRole('textbox', { name: 'Write a timed comment' });
  await box.fill(text);
  await box.press('Enter');
  await expect(page.getByText(text).first()).toBeVisible();
});

test('listener: a played track shows up in Library → History', async ({
  page,
}) => {
  await open(page, '/t/demo-archive-3');
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Play Late Session', exact: true })
    .first()
    .click();
  await expect(page.getByTestId('now-playing-title')).toHaveText(
    'Late Session',
  );
  await open(page, '/library/history');
  await expect(
    page.getByRole('main').getByText('Late Session').first(),
  ).toBeVisible();
});

test('listener: adds and removes a Latest News source', async ({ page }) => {
  await open(page, '/');
  await page.evaluate(() => {
    const key = 'tahti-web-listener-widgets';
    const raw = localStorage.getItem(key);
    const stored = raw ? JSON.parse(raw) : { state: {}, version: 2 };
    stored.state.installedTypeIds = ['news'];
    stored.state.instances = [
      {
        id: 'e2e-news',
        typeId: 'news',
        input: 'https://djmag.com/rss.xml',
        label: 'DJ Mag',
        addedAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(key, JSON.stringify(stored));
  });
  await open(page, '/');
  const latest = page.getByTestId('latest-news');
  await expect(latest.getByTestId('news-story').first()).toBeVisible();
  await latest.getByRole('button', { name: /Sources/ }).click();
  const sources = page.getByRole('dialog', { name: 'News sources' });
  await sources.getByRole('button', { name: 'Add CDM' }).click();
  await expect(
    sources
      .getByRole('list', { name: 'Your sources' })
      .getByText('CDM', { exact: true }),
  ).toBeVisible();
  await sources.getByRole('button', { name: 'Remove DJ Mag' }).click();
  await expect(
    sources
      .getByRole('list', { name: 'Your sources' })
      .getByText('DJ Mag', { exact: true }),
  ).toHaveCount(0);
});

test('listener: the light / dark switch in Settings sticks after a reload', async ({
  page,
}) => {
  const look = () =>
    page.evaluate(
      () =>
        `${document.documentElement.className}|${JSON.stringify(document.documentElement.dataset)}`,
    );
  await open(page, '/settings/themes');
  const toggle = page.getByRole('switch', { name: 'Toggle theme' });
  const before = await look();
  await toggle.click();
  await expect.poll(look).not.toBe(before);
  const after = await look();
  await page.reload();
  await expect.poll(look).toBe(after);
});

test('listener: replies in a direct message conversation', async ({ page }) => {
  const text = `See you at the next set ${Date.now()}`;
  await open(page, '/messages');
  await page
    .getByRole('button', { name: /Loved the set last night!/ })
    .first()
    .click();
  await expect(page.getByTestId('dm-thread')).toHaveCount(1);
  const thread = page.getByTestId('dm-thread');
  await expect(thread.getByText('Thanks — more soon.')).toBeVisible();
  await thread
    .getByRole('textbox', { name: 'Message', exact: true })
    .fill(text);
  await thread.getByRole('button', { name: 'Send' }).click();
  await expect(thread.getByText(text)).toBeVisible();
});
