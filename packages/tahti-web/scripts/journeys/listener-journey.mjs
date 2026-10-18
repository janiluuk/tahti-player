#!/usr/bin/env node
/**
 * Listener journey — signs in as `listener@tahti.live` (mock mode's plain
 * listener account) and browses library, history, favorites, messages, settings, and
 * views a paid fan-tier subscribe page as a signed-in listener (buy side of
 * paid content — pairs with artist-journey.mjs's add-ons/export sell side).
 *
 *   VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev -- --port 5195
 *   node scripts/journeys/listener-journey.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BASE,
  injectState,
  runThemedJourney,
  shot,
  signIn,
  summarize,
  writeManifest,
} from './lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../../docs/e2e-journeys/listener');
const ARTIST = process.env.JOURNEY_ARTIST_SLUG ?? 'demo';

const steps = [
  { path: '/library', file: '01-library.png', label: 'Library' },
  { path: '/history', file: '02-history.png', label: 'Listening history' },
  { path: '/favorites', file: '03-favorites.png', label: 'Favorites' },
  { path: '/messages', file: '04-messages.png', label: 'Messages' },
  {
    path: '/settings/account',
    file: '05-settings-account.png',
    label: 'Account settings',
  },
  { path: '/sources', file: '06-sources.png', label: 'Connected sources' },
  {
    path: `/channel/${ARTIST}`,
    file: '07-channel-as-listener.png',
    label: 'Channel, signed in',
  },
  {
    path: `/subscribe/${ARTIST}`,
    file: '08-fan-tier-subscribe.png',
    label: 'Fan tier subscribe (buy side)',
  },
];

const manifest = steps.map(({ file, label }) => ({ file, label }));

async function main() {
  console.log('\n── Listener journey (Playwright + screenshots) ──');
  await runThemedJourney(OUT, async (page, theme, outDir) => {
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await injectState(page, { colorMode: theme });
    await signIn(page, 'listener@tahti.live');
    for (const { path, file } of steps) {
      await page.goto(`${BASE}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 20_000,
      });
      await page.waitForTimeout(700);
      await shot(page, outDir, file);
    }
  });
  await writeManifest(OUT, manifest);
  summarize('Listener journey', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
