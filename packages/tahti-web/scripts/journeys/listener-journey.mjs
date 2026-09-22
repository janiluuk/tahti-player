#!/usr/bin/env node
/**
 * Listener journey — a verified, channel-less account (mock login always
 * yields an ARTIST account, so this persona's auth is injected directly —
 * see lib.mjs) browses library, history, favorites, messages, settings, and
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
  summarize,
  visitAndShot,
  writeManifest,
} from './lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../../docs/e2e-journeys/listener');
const ARTIST = process.env.JOURNEY_ARTIST_SLUG ?? 'demo';

const LISTENER_USER = {
  id: 'mock-listener-1',
  email: 'listener@tahti.live',
  username: 'listener',
  displayName: 'Demo Listener',
  role: 'LISTENER',
  roles: ['LISTENER'],
  tier: 'MEMBER',
  avatarUrl: null,
  isMember: true,
  isBoard: false,
  channel: null,
};

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
    await injectState(page, { authUser: LISTENER_USER, colorMode: theme });
    for (const step of steps) {
      await visitAndShot(page, outDir, step);
    }
  });
  await writeManifest(OUT, manifest);
  summarize('Listener journey', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
