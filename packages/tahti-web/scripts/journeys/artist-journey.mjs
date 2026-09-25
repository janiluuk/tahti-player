#!/usr/bin/env node
/**
 * Artist journey — the deep one. Real login, then:
 *
 *   1. Studio dashboard (light + dark hero shots)
 *   2. A real track upload (input[type=file] -> Upload -> auto-navigates to
 *      the uploaded track's view/editor page — the "view the track" step)
 *   3. Channel designer, walked through every tab (default/radio/green-room
 *      /multicast/selects)
 *   4. The Listener and Artist add-on lists with every group expanded
 *      (import, releasing, broadcast, channel, production, radio, widgets)
 *      — the import/export/addons tour
 *   5. An exhaustive sweep of every other studio tab/route (single theme —
 *      see lib.mjs runSingleThemeSweep; a full light+dark pass across ~30
 *      pages was judged excessive for what this run is trying to show)
 *
 *   VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev -- --port 5195
 *   node scripts/journeys/artist-journey.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BASE,
  fail,
  injectState,
  makeSilentWav,
  ok,
  runSingleThemeSweep,
  runThemedJourney,
  shot,
  summarize,
  sweepRoutes,
  writeManifest,
} from './lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../../docs/e2e-journeys/artist');
const EMAIL = process.env.JOURNEY_ARTIST_EMAIL ?? 'artist@tahti.live';
const PASSWORD = process.env.JOURNEY_ARTIST_PASSWORD ?? 'demo-password';

const CHANNEL_TABS = [
  ['/studio/channel', '05a-channel-designer-default'],
  ['/studio/channel?tab=radio', '05b-channel-designer-radio'],
  ['/studio/channel?tab=green-room', '05c-channel-designer-green-room'],
  ['/studio/channel?tab=multicast', '05d-channel-designer-multicast'],
  ['/studio/channel?tab=selects', '05e-channel-designer-selects'],
];

// 'Admin' omitted: PluginStorePanel.tsx shows it to board users only.
const ADDON_CATEGORIES = ['Listener', 'Artist'];

// Exhaustive sweep of every remaining studio tab. The channel designer tabs
// and upload/track view get their own dedicated steps above, so they're not
// repeated here.
const STUDIO_SWEEP = [
  ['/studio', 'studio-dashboard'],
  ['/studio/stats', 'studio-stats'],
  ['/studio/updates', 'studio-updates'],
  ['/studio/distribution', 'studio-distribution'],
  ['/studio/insights', 'studio-insights'],
  ['/studio/revenue', 'studio-fanbase'],
  ['/library', 'library'],
  ['/studio/archive', 'library-archive'],
  ['/studio/releases', 'library-releases'],
  ['/studio/collections', 'library-collections'],
  ['/studio/playlists', 'library-playlists'],
  ['/studio/recordings', 'library-recordings'],
  ['/studio/editor', 'library-editor'],
  ['/studio/stash', 'library-stash'],
  ['/studio/go-live', 'perform-go-live'],
  ['/studio/schedule', 'perform-schedule'],
  ['/studio/events', 'perform-events'],
  ['/studio/events/new', 'perform-events-new'],
  ['/studio/venues', 'perform-venues'],
  ['/studio/shows', 'perform-shows'],
  ['/studio/shows/show-series-demo', 'perform-show-detail'],
  ['/studio/moderation', 'manage-moderation'],
  ['/studio/setup-channel', 'manage-setup'],
  ['/settings/account', 'settings-account'],
  ['/settings/artist', 'settings-artist'],
  ['/settings/channel', 'settings-channel'],
  ['/settings/broadcast', 'settings-broadcast'],
  ['/settings/themes', 'settings-themes'],
  ['/settings/plugin-store', 'settings-addons'],
  ['/settings/whats-new', 'settings-whats-new'],
];

async function main() {
  console.log('\n── Artist journey (Playwright + screenshots) ──');
  const heroManifest = [
    { file: '01-login-filled.png', label: 'Login form (artist credentials)' },
    { file: '02-studio-dashboard.png', label: 'Studio dashboard' },
    { file: '03-upload-form.png', label: 'Upload — file chosen' },
    { file: '04-track-view.png', label: 'Uploaded track view (editor)' },
    ...CHANNEL_TABS.map(([, id]) => ({ file: `${id}.png`, label: id })),
    { file: '06-addons-index.png', label: 'Add-ons store index' },
  ];

  await runThemedJourney(OUT, async (page, theme, outDir) => {
    await page.goto(`${BASE}/login`, { waitUntil: 'load' });
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.screenshot({
      path: join(outDir, '01-login-filled.png'),
      fullPage: true,
    });
    ok('screenshot 01-login-filled.png');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page
      .getByRole('button', { name: /^Signed in as/ })
      .waitFor({ state: 'visible', timeout: 15_000 });
    ok('artist session (real login, mock backend)');
    await injectState(page, { authUser: null, colorMode: theme });
    await page.reload({ waitUntil: 'domcontentloaded' });

    await page.goto(`${BASE}/studio`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await shot(page, outDir, '02-studio-dashboard.png', 'studio dashboard');

    // Real upload -> auto-navigates to the track's view/editor page.
    await page.goto(`${BASE}/studio/upload`, { waitUntil: 'domcontentloaded' });
    const wav = makeSilentWav();
    await page.locator('input[type="file"]').setInputFiles({
      name: `journey-track-${Date.now()}.wav`,
      mimeType: 'audio/wav',
      buffer: wav,
    });
    await page.waitForTimeout(500);
    await shot(page, outDir, '03-upload-form.png', 'upload — file chosen');
    await page.getByRole('button', { name: 'Upload file' }).click();
    try {
      await page.waitForURL(/\/studio\/sounds\//, { timeout: 20_000 });
      ok('track uploaded, navigated to track view');
    } catch (e) {
      fail('upload did not navigate to track view', e.message);
    }
    await page.waitForTimeout(800);
    await shot(page, outDir, '04-track-view.png', 'uploaded track view');

    // Channel designer — every tab.
    for (const [path, id] of CHANNEL_TABS) {
      await page.goto(`${BASE}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 20_000,
      });
      await page.waitForTimeout(700);
      await shot(page, outDir, `${id}.png`, id);
    }

    // Add-ons store — every category tab (import/export/addons tour).
    await page.goto(`${BASE}/settings/plugin-store`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(700);
    await shot(page, outDir, '06-addons-index.png', 'add-ons index');
    for (const category of ADDON_CATEGORIES) {
      const button = page.getByRole('tab', { name: category, exact: true });
      if ((await button.count()) === 0) {
        fail(`add-ons category not found: ${category}`);
        continue;
      }
      await button.first().click();
      await page.waitForTimeout(500);
      const collapsed = page.locator('section > button[aria-expanded="false"]');
      while ((await collapsed.count()) > 0) {
        await collapsed.first().click();
        await page.waitForTimeout(150);
      }
      const slug = category.toLowerCase().replace(/\s+/g, '-');
      await shot(
        page,
        outDir,
        `06-addons-${slug}.png`,
        `add-ons — ${category}`,
      );
    }
  });

  await writeManifest(OUT, heroManifest);

  // Exhaustive "every other tab" sweep — single theme (dark), see file header.
  await runSingleThemeSweep(
    join(OUT, 'sweep'),
    'dark',
    async (page, colorMode, outDir) => {
      await page.goto(`${BASE}/login`, { waitUntil: 'load' });
      await page.getByLabel('Email').fill(EMAIL);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page
        .getByRole('button', { name: /^Signed in as/ })
        .waitFor({ state: 'visible', timeout: 15_000 });
      await injectState(page, { authUser: null, colorMode });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await sweepRoutes(page, outDir, STUDIO_SWEEP);
    },
  );
  await writeManifest(
    join(OUT, 'sweep'),
    STUDIO_SWEEP.map(([, id]) => ({ file: `${id}.png`, label: id })),
  );

  summarize('Artist journey', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
