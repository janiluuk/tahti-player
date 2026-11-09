import { expect, test, type Page } from '@playwright/test';

import { acknowledgeGuidelines, signInAsListener } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await signInAsListener(page);
});

async function playNightDrive(page: Page) {
  await page.goto('/r/night-drive');
  await acknowledgeGuidelines(page);
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Play all' })
    .click();
  await expect(page.getByTestId('now-playing-title')).toHaveText(
    'Aurora Drift',
  );
}

function seconds(clock: string): number {
  const [minutes, secs] = clock.replace('-', '').split(':').map(Number);
  return minutes * 60 + secs;
}

test('listener: seeks halfway through a track from the player bar', async ({
  page,
}) => {
  await playNightDrive(page);
  const bar = page.getByRole('contentinfo');
  const seek = bar.getByRole('slider', { name: 'Seek' });
  const elapsed = bar.getByTestId('player-seek-elapsed');
  // A seek sent before the stream starts is reset when the audio loads.
  await expect
    .poll(async () => seconds((await elapsed.textContent()) ?? '0:00'))
    .toBeGreaterThan(0);
  await expect(seek).toHaveAttribute('tabindex', '0');
  const box = await seek.boundingBox();
  if (!box) {
    throw new Error('Seek bar has no box');
  }
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect
    .poll(async () => Number(await seek.getAttribute('aria-valuenow')))
    .toBeGreaterThanOrEqual(45);
  await expect
    .poll(async () => seconds((await elapsed.textContent()) ?? '0:00'))
    .toBeGreaterThan(150);
  await expect(seek).toHaveAttribute('tabindex', '0');
  await seek.focus();
  const before = seconds((await elapsed.textContent()) ?? '0:00');
  await page.keyboard.press('PageDown');
  await expect
    .poll(async () => seconds((await elapsed.textContent()) ?? '0:00'))
    .toBeLessThan(before);
});

test('listener: the full-screen player skips, pauses and minimizes', async ({
  page,
}) => {
  await playNightDrive(page);
  await page
    .getByRole('contentinfo')
    .getByRole('button', { name: 'Open full-screen player' })
    .click();
  const full = page.getByRole('dialog', { name: 'Now playing, full screen' });
  await expect(
    full.getByRole('heading', { level: 1, name: 'Aurora Drift' }),
  ).toBeVisible();

  await full.getByRole('button', { name: 'Next' }).click();
  await expect(
    full.getByRole('heading', { level: 1, name: 'Midnight Broadcast' }),
  ).toBeVisible();

  const pause = full.getByRole('button', { name: 'Pause' });
  await pause.click();
  await expect(
    full.getByRole('button', { name: 'Play', exact: true }),
  ).toBeVisible();

  await full.getByRole('button', { name: 'Minimize player' }).click();
  await expect(full).toBeHidden();
  await expect(page.getByTestId('now-playing-title')).toHaveText(
    'Midnight Broadcast',
  );
});

test('listener: sends the board a correction request and sees it listed', async ({
  page,
}) => {
  const text = `My home municipality is Tampere ${Date.now()}`;
  await page.goto('/governance');
  await acknowledgeGuidelines(page);
  const main = page.getByRole('main');
  await main
    .getByRole('textbox', { name: 'What is wrong, and what should it be?' })
    .fill(text);
  await main.getByRole('button', { name: 'Send to the board' }).click();
  await expect(main.getByText(text)).toBeVisible();
  await expect(
    main.getByRole('textbox', {
      name: 'What is wrong, and what should it be?',
    }),
  ).toHaveValue('');
});

test('listener: activates the Radio Browser add-on and turns it off again', async ({
  page,
}) => {
  await page.goto('/settings/plugin-store');
  await acknowledgeGuidelines(page);
  const panel = () =>
    page
      .getByRole('dialog', { name: 'Settings' })
      .getByRole('tabpanel', { name: 'Listener' });
  const toggle = () =>
    panel().getByRole('switch', { name: /^Radio Browser directory/ });
  await panel().getByRole('button', { name: 'Activate' }).first().click();
  await expect(panel().getByRole('button', { name: 'Active' })).toBeDisabled();
  await expect(toggle()).toBeChecked();
  await page.reload();
  await expect(toggle()).toBeChecked();
  await toggle().click();
  await expect(toggle()).toHaveCount(0);
  await expect(panel().getByRole('button', { name: 'Activate' })).toBeEnabled();
});
