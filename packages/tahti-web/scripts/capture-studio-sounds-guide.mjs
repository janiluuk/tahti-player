/**
 * One-shot screenshot for the user-manual Library → Sounds section.
 * Expects Vite with VITE_FORCE_MOCK=1 on GUIDE_BASE_URL (default :5190).
 */
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

import {
  CAPTURE_THEME_STATE,
  prepareCapturePage,
} from './lib/captureSetup.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.GUIDE_BASE_URL || 'http://127.0.0.1:5190';
const outDir = join(__dirname, '../../docs/.gitbook/assets');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'studio-sounds-library.png');

const ARTIST_USER = {
  id: 'mock-1',
  email: 'demo@tahti.live',
  username: 'demo',
  displayName: 'Mart Saar',
  role: 'BOARD',
  isBoard: true,
  membershipStatus: 'ACTIVE',
  channel: { slug: 'demo', state: 'OFFLINE' },
};

const AUTH_STATE = { state: { user: ARTIST_USER }, version: 0 };

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});
await prepareCapturePage(page);

await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.evaluate(
  ({ auth, theme }) => {
    localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
    localStorage.setItem(`tahti-web-onboarded:${auth.state.user.id}`, '1');
    localStorage.setItem(
      'tahti-web-layout',
      JSON.stringify({
        state: {
          leftCollapsed: false,
          rightCollapsed: true,
          leftWidth: 220,
          rightWidth: 340,
          bottomQueueOpen: false,
        },
        version: 3,
      }),
    );
    localStorage.setItem('tahti-web-theme', JSON.stringify(theme));
    localStorage.setItem('tahti.ambientTrackList.density', 'list');
  },
  { auth: AUTH_STATE, theme: CAPTURE_THEME_STATE },
);

await page.goto(`${BASE}/library/sounds`, { waitUntil: 'networkidle' });
await page
  .locator('main')
  .waitFor({ state: 'visible', timeout: 8000 })
  .catch(() => {});
await page.waitForTimeout(1000);
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

// Switch track size / view to List via the combobox / button in SoundFilters.
const viewControl = page.getByRole('button', { name: /track size|view|list|comfortable|compact/i });
if (await viewControl.first().isVisible().catch(() => false)) {
  await viewControl.first().click();
  await page.waitForTimeout(200);
  const listOption = page.getByRole('option', { name: /^list$/i }).or(
    page.getByRole('menuitem', { name: /^list$/i }),
  );
  if (await listOption.first().isVisible().catch(() => false)) {
    await listOption.first().click();
    await page.waitForTimeout(500);
  } else {
    await page.keyboard.press('Escape');
  }
}

await page.keyboard.press('Escape');
await page.waitForTimeout(200);

const boxes = page.getByRole('checkbox');
const count = await boxes.count();
for (let i = 0; i < count; i += 1) {
  const box = boxes.nth(i);
  const label = (await box.getAttribute('aria-label')) ?? '';
  if (/select all/i.test(label)) {
    continue;
  }
  await box.check({ force: true }).catch(() => box.click({ force: true }));
  break;
}
await page.waitForTimeout(400);
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

await page.screenshot({ path: outPath, fullPage: false });
console.log(`wrote ${outPath} (checkboxes=${count})`);
await browser.close();
