#!/usr/bin/env node
/**
 * Admin journey — board account (injected auth; mock login can't produce
 * isBoard — see lib.mjs) tours the full admin console. Hero shots (light +
 * dark) for the dashboard, users, and moderation; an exhaustive sweep of
 * every remaining admin tab at a single theme (dark) — see
 * artist-journey.mjs for why a full light+dark pass isn't done for the
 * sweep.
 *
 *   VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web dev -- --port 5195
 *   node scripts/journeys/admin-journey.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BASE,
  injectState,
  runSingleThemeSweep,
  runThemedJourney,
  summarize,
  sweepRoutes,
  visitAndShot,
  writeManifest,
} from './lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../../docs/e2e-journeys/admin');

const BOARD_USER = {
  id: 'mock-board-1',
  email: 'board@tahti.live',
  username: 'board',
  displayName: 'Board Member',
  role: 'BOARD',
  roles: ['BOARD', 'ARTIST'],
  tier: 'ARTIST',
  avatarUrl: null,
  isMember: true,
  isBoard: true,
  channel: {
    slug: 'demo',
    state: 'OFFLINE',
    goneLiveAt: null,
    customDomain: null,
    customDomainVerified: false,
  },
};

const HERO_STEPS = [
  { path: '/admin', file: '01-admin-dashboard.png', label: 'Admin dashboard' },
  { path: '/admin/users', file: '02-admin-users.png', label: 'User directory' },
  {
    path: '/admin/moderation',
    file: '03-admin-moderation.png',
    label: 'Moderation hub',
  },
];

const ADMIN_SWEEP = [
  ['/admin', 'admin-dashboard'],
  ['/admin/logs', 'admin-logs'],
  ['/admin/logs?tab=containers', 'admin-logs-containers'],
  ['/admin/logs?tab=recent-audit', 'admin-logs-recent-audit'],
  ['/admin/status', 'admin-status'],
  ['/admin/moderation', 'admin-moderation'],
  ['/admin/moderation/support', 'admin-moderation-support'],
  ['/admin/moderation/beta', 'admin-moderation-beta'],
  ['/admin/moderation/radio-submissions', 'admin-moderation-radio-submissions'],
  ['/admin/moderation/content-reports', 'admin-moderation-content-reports'],
  ['/admin/moderation/feature-requests', 'admin-moderation-feature-requests'],
  ['/admin/moderation/missed-shows', 'admin-moderation-missed-shows'],
  ['/admin/users', 'admin-users'],
  ['/admin/radio', 'admin-radio'],
  ['/admin/news', 'admin-news'],
  ['/admin/streams', 'admin-streams'],
  ['/admin/top-lists', 'admin-top-lists'],
  ['/admin/announcements', 'admin-announcements'],
  ['/admin/storage', 'admin-storage'],
  ['/admin/storage?tab=files', 'admin-storage-files'],
  ['/admin/financial', 'admin-financial'],
  ['/admin/governance', 'admin-governance'],
  ['/admin/grants', 'admin-grants'],
  ['/admin/agm', 'admin-agm'],
  ['/admin/missed-shows', 'admin-missed-shows'],
  ['/admin/vendors', 'admin-vendors'],
  ['/admin/i18n', 'admin-i18n'],
  ['/admin/tahti-selects', 'admin-selects'],
  ['/admin/beta', 'admin-beta'],
  ['/admin/orphan-pages', 'admin-orphan-pages'],
  ['/admin/content', 'admin-content'],
  ['/admin/content-reports', 'admin-content-reports'],
  ['/admin/reports', 'admin-reports'],
  ['/admin/feature-requests', 'admin-feature-requests'],
  ['/admin/artwork-presets', 'admin-artwork-presets'],
  ['/admin/files', 'admin-files'],
];

async function main() {
  console.log('\n── Admin journey (Playwright + screenshots) ──');

  await runThemedJourney(OUT, async (page, theme, outDir) => {
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await injectState(page, { authUser: BOARD_USER, colorMode: theme });
    for (const step of HERO_STEPS) {
      await visitAndShot(page, outDir, step);
    }
  });
  await writeManifest(
    OUT,
    HERO_STEPS.map(({ file, label }) => ({ file, label })),
  );

  await runSingleThemeSweep(
    join(OUT, 'sweep'),
    'dark',
    async (page, colorMode, outDir) => {
      await page.goto(`${BASE}/`, { waitUntil: 'load' });
      await injectState(page, { authUser: BOARD_USER, colorMode });
      await sweepRoutes(page, outDir, ADMIN_SWEEP);
    },
  );
  await writeManifest(
    join(OUT, 'sweep'),
    ADMIN_SWEEP.map(([, id]) => ({ file: `${id}.png`, label: id })),
  );

  summarize('Admin journey', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
