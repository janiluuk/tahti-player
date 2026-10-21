/**
 * Captures the Pro audio editor with a real decoded waveform: the mock
 * source URL (DEMO_MP3) is answered with a local audio file, so the editor's
 * real decode and render path runs. Two shots per theme: the whole file,
 * and a zoomed-in selection.
 *
 * Expects Vite with VITE_FORCE_MOCK=1 on REDESIGN_BASE_URL (default :5190).
 *
 *   EDITOR_AUDIO=/tmp/excerpt.wav node scripts/capture-editor-waveform.mjs
 *   CAPTURE_THEME_MODE=light EDITOR_AUDIO=... node scripts/capture-editor-waveform.mjs
 *
 * The audio should last as long as the mock sound it stands in for
 * (`arch-mock-2`, 214 s): the editor keeps the draft's duration and only
 * adopts the decoded one when the draft has none. Never commit the audio.
 */
import { mkdirSync, readFileSync } from 'fs';
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

import {
  CAPTURE_THEME_STATE,
  prepareCapturePage,
  withThemeSuffix,
} from './lib/captureSetup.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../docs/redesign-shots');
mkdirSync(outDir, { recursive: true });

const BASE = process.env.REDESIGN_BASE_URL || 'http://127.0.0.1:5190';
const AUDIO = process.env.EDITOR_AUDIO;
const SOUND_ID = process.env.EDITOR_SOUND_ID || 'arch-mock-2';
/** Seconds of the zoomed selection, as fractions of the file. */
const ZOOM_FROM = Number(process.env.EDITOR_ZOOM_FROM ?? 77 / 214);
const ZOOM_TO = Number(process.env.EDITOR_ZOOM_TO ?? 107 / 214);
const DEMO_MP3 =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

if (!AUDIO) {
  console.error('Set EDITOR_AUDIO to a local audio file.');
  process.exit(1);
}

const CONTENT_TYPES = {
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
};
const audioBody = readFileSync(AUDIO);
const contentType = CONTENT_TYPES[extname(AUDIO).toLowerCase()] ?? 'audio/wav';

const authState = {
  state: {
    user: {
      id: 'mock-board-1',
      email: 'board@tahti.live',
      username: 'board',
      displayName: 'Board Member',
      isBoard: true,
      membershipStatus: 'ACTIVE',
      channel: { slug: 'demo', state: 'OFFLINE' },
    },
  },
  version: 0,
};

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
await prepareCapturePage(page);
const layoutState = {
  state: {
    leftCollapsed: false,
    rightCollapsed: true,
    bottomQueueOpen: false,
    leftWidth: 220,
    rightWidth: 340,
    chatSlug: null,
    chatEnabled: false,
    chatDisabledReason: null,
    chatAutoOpenedFor: null,
  },
  version: 3,
};

await page.addInitScript(
  ({ auth, theme, layout }) => {
    localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
    localStorage.setItem('tahti-web-onboarded:mock-board-1', '1');
    localStorage.setItem('tahti-web-layout', JSON.stringify(layout));
    localStorage.setItem('tahti-web-theme', JSON.stringify(theme));
  },
  { auth: authState, theme: CAPTURE_THEME_STATE, layout: layoutState },
);
await page.route(DEMO_MP3, (route) =>
  route.fulfill({
    status: 200,
    contentType,
    headers: { 'access-control-allow-origin': '*' },
    body: audioBody,
  }),
);

await page.goto(`${BASE}/studio/sounds/${SOUND_ID}/editor`, {
  waitUntil: 'networkidle',
});
const waveform = page.locator('[role="application"]').first();
await waveform.waitFor({ state: 'visible', timeout: 30_000 });
await page
  .getByText('Loading the sample-accurate waveform…')
  .waitFor({ state: 'detached', timeout: 60_000 })
  .catch(() => {});
await page.waitForTimeout(1500);

const full = join(outDir, withThemeSuffix('studio-sound-editor-waveform.png'));
await page.screenshot({ path: full });
console.log('wrote', full);

const box = await waveform.boundingBox();
if (!box) {
  throw new Error('waveform has no bounding box');
}
const y = box.y + box.height / 2;
await page.mouse.move(box.x + box.width * ZOOM_FROM, y);
await page.mouse.down();
await page.mouse.move(box.x + box.width * ZOOM_TO, y, { steps: 12 });
await page.mouse.up();
await page.getByRole('button', { name: 'Zoom to selection' }).click();
// Clear the selection (it tints the detail) and move off the toolbar so its
// tooltip closes; the zoomed view stays.
await waveform.focus();
await page.keyboard.press('Escape');
await page.mouse.move(box.x + box.width / 2, box.y - 40);
await page.waitForTimeout(1000);

const zoomed = join(
  outDir,
  withThemeSuffix('studio-sound-editor-waveform-zoomed.png'),
);
await page.screenshot({ path: zoomed });
console.log('wrote', zoomed);

await browser.close();
