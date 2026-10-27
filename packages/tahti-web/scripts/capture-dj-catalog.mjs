/**
 * Captures the desktop DJ catalog from its Storybook stories: the native
 * library only exists inside the desktop app, so the mock web app can't
 * render these screens. Stories install a fake native library with analysed
 * tracks (packages/storybook/src/tahti-web/_fixtures/dj-library.ts).
 *
 * Expects Storybook on STORYBOOK_URL (default :6006, `pnpm storybook`).
 *
 *   node scripts/capture-dj-catalog.mjs
 *   CAPTURE_THEME_MODE=light node scripts/capture-dj-catalog.mjs
 *   SHOT=desktop-prepare node scripts/capture-dj-catalog.mjs
 *
 * Writes README captures to docs/redesign-shots/ (`--light` in light mode)
 * and, in dark mode, the user guide copies to packages/docs/.gitbook/assets/.
 */
import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

import { CAPTURE_THEME_MODE, withThemeSuffix } from './lib/captureSetup.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../docs/redesign-shots');
const guideDir = join(__dirname, '../../docs/.gitbook/assets');
mkdirSync(outDir, { recursive: true });

const BASE = process.env.STORYBOOK_URL || 'http://127.0.0.1:6006';

const only = process.env.SHOT;
const shots = [
  {
    story: 'tahti-misc-desktoplibrarypanel--dj-catalog',
    file: 'desktop-dj-catalog',
    viewport: { width: 1440, height: 780 },
    ready: 'Aurora Drive',
  },
  {
    story: 'tahti-misc-desktoplibrarypanel--dj-catalog',
    file: 'desktop-dj-settings',
    viewport: { width: 1440, height: 780 },
    ready: 'Aurora Drive',
    act: async (page) => {
      await page.getByRole('button', { name: 'DJ settings' }).click();
      await page.getByTestId('dj-settings').waitFor();
      await page.mouse.move(10, 10);
    },
  },
  {
    story: 'tahti-misc-desktoplibrarypanel--dj-catalog',
    file: 'desktop-prepare',
    viewport: { width: 1440, height: 900 },
    ready: 'Aurora Drive',
    clip: 'dialog',
    act: async (page) => {
      await page
        .getByRole('button', { name: 'Details for Aurora Drive' })
        .click();
      const add = page.getByRole('button', { name: 'Add to Prepare' });
      await add.waitFor();
      await add.scrollIntoViewIfNeeded();
    },
  },
  {
    story: 'tahti-desktop-mixabletrackssection--matches',
    file: 'desktop-mixes-well-with',
    viewport: { width: 640, height: 420 },
    ready: 'Harbour Lights',
  },
  {
    story: 'tahti-desktop-trackanalysissection--bpm-tools',
    file: 'desktop-bpm-tools',
    viewport: { width: 640, height: 520 },
    ready: 'Tap along with the beat',
  },
  {
    story: 'tahti-desktop-playhistorydialog--last-session',
    file: 'desktop-copy-last-session',
    viewport: { width: 900, height: 720 },
    ready: 'Copy last session',
  },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

for (const shot of shots.filter((shot) => !only || shot.file === only)) {
  const page = await browser.newPage({
    viewport: shot.viewport,
    deviceScaleFactor: 2,
  });
  await page.emulateMedia({
    reducedMotion: 'reduce',
    colorScheme: CAPTURE_THEME_MODE,
  });
  const globals = `themeMode:${CAPTURE_THEME_MODE}`;
  await page.goto(
    `${BASE}/iframe.html?id=${shot.story}&viewMode=story&globals=${globals}`,
    { waitUntil: 'domcontentloaded', timeout: 30000 },
  );
  await page
    .getByText(shot.ready, { exact: false })
    .first()
    .waitFor({ timeout: 20000 });
  if (shot.act) {
    await shot.act(page);
  }
  await page.waitForTimeout(600);
  const fileName = withThemeSuffix(`${shot.file}-v1.png`);
  const imagePath = join(outDir, fileName);
  const target =
    shot.clip === 'dialog'
      ? page
          .locator('div.overflow-y-auto')
          .filter({ hasText: 'Add to Prepare' })
          .last()
      : page;
  await target.screenshot({ path: imagePath, type: 'png' });
  if (CAPTURE_THEME_MODE === 'dark') {
    copyFileSync(imagePath, join(guideDir, `${shot.file}.png`));
  }
  console.log(`${fileName}`);
  await page.close();
}

await browser.close();
