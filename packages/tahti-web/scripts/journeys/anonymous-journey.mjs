#!/usr/bin/env node
/**
 * Anonymous visitor journey — no login. Home/listen -> radio -> a public
 * channel -> artist profile -> fan-tier subscribe -> smart link -> venues ->
 * help -> login/join forms. Route list from docs/SCREEN-ATLAS.md "Anonymous
 * / public". Captures light + dark (see lib.mjs for why never tahti-dark).
 *
 *   VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev -- --port 5195
 *   node scripts/journeys/anonymous-journey.mjs
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE, injectState, ok, runThemedJourney, shot, writeManifest, summarize } from './lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../../docs/e2e-journeys/anonymous');
const ARTIST = process.env.JOURNEY_ARTIST_SLUG ?? 'demo';

const steps = [
  { path: '/', file: '01-home.png', label: 'Home / listen' },
  { path: '/radio', file: '02-radio.png', label: 'Tahti Radio' },
  { path: `/channel/${ARTIST}`, file: '03-channel.png', label: 'Public channel' },
  { path: `/u/${ARTIST}`, file: '04-artist-profile.png', label: 'Artist profile' },
  { path: `/subscribe/${ARTIST}`, file: '05-fan-tier-subscribe.png', label: 'Fan tier subscribe (buy side)' },
  { path: '/venues', file: '06-venues.png', label: 'Venues' },
  { path: '/help', file: '07-help.png', label: 'Help center' },
  { path: '/transparency', file: '08-transparency.png', label: 'Transparency' },
  { path: '/login', file: '09-login.png', label: 'Login' },
  { path: '/join', file: '10-join.png', label: 'Join (signup)' },
];

const manifest = steps.map(({ file, label }) => ({ file, label }));

async function main() {
  console.log('\n── Anonymous visitor journey (Playwright + screenshots) ──');
  await runThemedJourney(OUT, async (page, theme, outDir) => {
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await injectState(page, { authUser: null, colorMode: theme });
    for (const { path, file, label } of steps) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.waitForTimeout(700);
      await shot(page, outDir, file, label);
    }
  });
  await writeManifest(OUT, manifest);
  summarize('Anonymous visitor journey', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
