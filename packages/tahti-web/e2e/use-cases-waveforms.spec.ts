import { devices, expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines } from './helpers/auth';

const CATALOG = '/channel/yaniho';
const GAP_TITLE = 'Moody Electronica vol. 32';

/** Audio the page asks for before anything plays: drawing a waveform must
 * never download a track. */
function audioRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (request) => {
    if (
      request.resourceType() === 'media' ||
      /\.mp3(\?|$)/.test(request.url())
    ) {
      urls.push(request.url());
    }
  });
  return urls;
}

test('anonymous: a channel catalog draws stored waveforms at once and never sits loading', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const audio = audioRequests(page);
  await page.goto(CATALOG);
  await acknowledgeGuidelines(page);

  const rows = page.getByTestId('ambient-track-row');
  await expect(rows.first()).toBeVisible();
  await expect(rows.first().locator('[data-waveform]').first()).toHaveAttribute(
    'data-waveform',
    'peaks',
  );
  await expect(
    page.locator('[data-waveform][data-state="loading"]'),
  ).toHaveCount(0);

  const gap = rows.filter({ hasText: GAP_TITLE });
  await gap.scrollIntoViewIfNeeded();
  const gapWave = gap.locator('[data-waveform]').first();
  await expect(gapWave).toHaveAttribute('data-waveform', 'empty');
  await expect(gapWave).toHaveAttribute('data-state', 'ready');
  await expect(
    page.locator('[data-waveform][data-state="loading"]'),
  ).toHaveCount(0);
  expect(audio).toEqual([]);
});

test.describe('on a phone', () => {
  test.use({
    viewport: devices['Pixel 7'].viewport,
    hasTouch: true,
    isMobile: true,
  });

  test('anonymous: only the playing track shows a play control on its artwork', async ({
    page,
  }) => {
    await page.goto(CATALOG);
    await acknowledgeGuidelines(page);
    const play = (volume: number) =>
      page
        .getByRole('row', {
          name: new RegExp(`Moody Electronica vol\\. ${volume} `),
        })
        .getByTestId('media-artwork-play');
    await expect(play(40)).toBeAttached();
    await expect(play(40)).toHaveCSS('opacity', '0');
    await expect(play(39)).toHaveCSS('opacity', '0');

    await play(39).tap();
    await expect(play(39)).toHaveAttribute('data-current', 'true');
    await expect(play(39)).toHaveCSS('opacity', '1');
    await expect(play(40)).toHaveCSS('opacity', '0');
  });
});
