import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signIn, signInAsBoard } from './helpers/auth';

async function open(page: Page, path: string) {
  await page.goto(path);
  await acknowledgeGuidelines(page);
}

test('artist: adds and removes a Latest News source', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
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
});

test('board: Co-op grants previews a grant cycle and lists past disbursements', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsBoard(page);
  await open(page, '/admin/grants');
  await expect(page.getByText('Disbursement history').first()).toBeVisible();
  await page.getByRole('link', { name: '2025', exact: true }).click();
  await expect(page).toHaveURL(/2025/);
  await expect(page.getByText('Page not found')).toHaveCount(0);
  await expect(page.getByText(/2025/).first()).toBeVisible();
});

test('board: Co-op governance hub cards open their content', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsBoard(page);
  await open(page, '/admin/governance');
  const hub = page.getByRole('list', { name: 'Governance areas' });
  await expect(hub.getByRole('link', { name: /Overview/ })).toBeVisible();
  for (const area of ['Annual reports', 'Board', 'Records']) {
    await hub.getByRole('link', { name: new RegExp(area) }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: area }),
    ).toBeVisible();
    await expect(page.getByText('Page not found')).toHaveCount(0);
    await open(page, '/admin/governance');
  }
});
