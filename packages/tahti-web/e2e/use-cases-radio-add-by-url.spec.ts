import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signInAsListener } from './helpers/auth';

const PLAYLIST_URL = 'https://kaamos.example/live.m3u';
const STREAM_URL = 'https://kaamos.example/stream';
const STATION = 'Kaamos FM';

/** The dialog resolves the playlist, probes the stream and looks it up in
 * Radio Browser; all three are answered here so the run stays offline. */
async function routeStation(page: Page): Promise<void> {
  await page.route(PLAYLIST_URL, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*' },
      contentType: 'audio/x-mpegurl',
      body: `#EXTM3U\n#EXTINF:-1,${STATION}\n${STREAM_URL}\n`,
    }),
  );
  await page.route(STREAM_URL, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*' },
      contentType: 'audio/mpeg',
      body: '',
    }),
  );
  await page.route('https://*.api.radio-browser.info/**', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*' },
      contentType: 'application/json',
      body: '[]',
    }),
  );
}

test('listener adds a station by URL and it shows inside the radio stations row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await routeStation(page);
  await signInAsListener(page);
  await page.goto('/radio');
  await acknowledgeGuidelines(page);

  const stations = page.getByTestId('radio-stations');
  const row = stations.getByTestId('radio-stations-row').first();
  await expect(
    row.getByRole('button', { name: `Play ${STATION}` }),
  ).toHaveCount(0);

  await row.getByRole('button', { name: 'Browse stations' }).click();
  await page.getByRole('button', { name: 'Add URL' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a station by URL' });
  await dialog.getByRole('textbox', { name: 'Stream URL' }).fill(PLAYLIST_URL);
  await dialog.getByRole('button', { name: 'Resolve & test' }).click();
  await expect(dialog.getByText(STATION)).toBeVisible();
  await dialog.getByRole('button', { name: 'Add to my stations' }).click();
  await expect(dialog).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await expect(
    row.getByRole('button', { name: `Play ${STATION}` }).first(),
  ).toBeVisible();
  await expect(
    stations.getByRole('heading', { name: 'Your stations' }),
  ).toHaveCount(0);

  await page.goto('/');
  await acknowledgeGuidelines(page);
  const listenRow = page.getByTestId('listen-radio').first();
  await listenRow.scrollIntoViewIfNeeded();
  await expect(
    listenRow.getByRole('button', { name: `Play ${STATION}` }).first(),
  ).toBeAttached();
});
