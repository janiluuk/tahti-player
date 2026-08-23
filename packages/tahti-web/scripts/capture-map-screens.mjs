import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outRoot = join(__dirname, '../public/map/nuclear');
mkdirSync(outRoot, { recursive: true });

const BASE = process.env.MAP_BASE_URL || 'https://beta.tahti.live';
const CHANNEL = process.env.MAP_CHANNEL || 'liis-kask-ee';
// username often equals slug prefix before -ee/-fi
const USER =
  process.env.MAP_USER || CHANNEL.replace(/-(ee|fi|vn|lv|se|no|dk)$/, '');

/** @type {{ id: string; path: string; wait?: number; auth?: boolean }[]} */
const shots = [
  { id: 'listen', path: '/', auth: false },
  { id: 'radio', path: '/radio', auth: false },
  { id: 'channel', path: `/channel/${CHANNEL}`, auth: false },
  { id: 'channel-chat', path: `/chat/${CHANNEL}`, auth: false },
  { id: 'profile', path: `/u/${USER}`, auth: false },
  {
    id: 'collection',
    path: `/u/${USER}/c/demo-collection`,
    auth: false,
  },
  { id: 'smart-link', path: '/r/demo-release', auth: false },
  { id: 'subscribe', path: `/subscribe/${USER}`, auth: false },
  { id: 'embed', path: `/embed/c/${CHANNEL}`, auth: false },
  { id: 'login', path: '/login', auth: false },
  { id: 'login-totp', path: '/login', auth: false },
  { id: 'join', path: '/join', auth: false },
  { id: 'verify', path: '/verify', auth: false },
  { id: 'library', path: '/library' },
  { id: 'listener-dashboard', path: '/dashboard' },
  { id: 'governance', path: '/governance', auth: false },
  { id: 'settings', path: '/settings' },
  { id: 'money-tiers', path: '/settings/money' },
  { id: 'money-fan-subs', path: '/settings/money' },
  { id: 'sources', path: '/sources' },
  { id: 'studio', path: '/studio' },
  { id: 'go-live', path: '/studio/go-live' },
  { id: 'archive', path: '/studio/archive' },
  { id: 'releases', path: '/studio/releases' },
  { id: 'collections', path: '/studio/collections' },
  { id: 'editor', path: '/studio/editor' },
  { id: 'upload', path: '/studio/upload' },
  { id: 'stash', path: '/studio/stash' },
  { id: 'schedule', path: '/studio/schedule' },
  { id: 'stats', path: '/studio/stats' },
  { id: 'stats-detail', path: '/studio/insights/archive/arch-mock-1' },
  { id: 'channel-design', path: '/studio/channel' },
  { id: 'setup-channel-gated', path: '/studio/channel?tab=setup' },
  { id: 'updates', path: '/studio/updates' },
  { id: 'revenue', path: '/studio/revenue' },
  { id: 'more', path: '/more' },
  { id: 'help', path: '/help', auth: false },
  { id: 'status', path: '/status', auth: false },
  { id: 'transparency', path: '/transparency', auth: false },
];

const requestedShotIds = new Set(
  (process.env.MAP_SHOT_IDS || '')
    .split(',')
    .map((shotId) => shotId.trim())
    .filter(Boolean),
);
const selectedShots = requestedShotIds.size
  ? shots.filter((shot) => requestedShotIds.has(shot.id))
  : shots;

let browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
let page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
});

// Pitch-quality captures: a named, populated artist (not generic "Demo
// Artist"), and LIVE so the go-live/studio shots show the real on-air
// state instead of an empty connect flow.
const AUTH_STATE = {
  state: {
    user: {
      id: 'mock-1',
      email: 'demo@tahti.live',
      username: USER,
      displayName: 'Mart Saar',
      isBoard: false,
      membershipStatus: 'ACTIVE',
      channel: { slug: CHANNEL, state: 'LIVE' },
    },
  },
  version: 0,
};

/** Right rail (chat/queue) is collapsed on every shot except one, so the
 * chat feature is demonstrated exactly once rather than showing
 * "Chat unavailable" on every single capture. */
const CHAT_DEMO_SHOT_ID = 'channel';

async function setLocalStorage(p, signedIn = true) {
  await p.evaluate(
    ({ auth, rightCollapsed, signedIn: shouldSignIn }) => {
      if (shouldSignIn) {
        localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
      } else {
        localStorage.removeItem('tahti-web-auth');
      }
      // Mark this mock user as already onboarded -- otherwise every
      // authenticated shot gets hijacked by a redirect to /onboarding.
      localStorage.setItem(`tahti-web-onboarded:${auth.state.user.id}`, '1');
      localStorage.setItem(
        'tahti-web-layout',
        JSON.stringify({
          state: {
            leftCollapsed: false,
            rightCollapsed,
            leftWidth: 220,
            rightWidth: 340,
            bottomQueueOpen: false,
          },
          version: 3,
        }),
      );
    },
    { auth: AUTH_STATE, rightCollapsed: true, signedIn },
  );
}

// Prime localStorage from an actual page on BASE before the shot loop
// (can't set localStorage before a document has loaded that origin).
await page
  .goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
  .catch(() => {});
await setLocalStorage(page);

async function ensurePage() {
  if (!browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || undefined,
    });
  }
  if (page.isClosed()) {
    page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    await page
      .goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 })
      .catch(() => {});
  }
}

for (const s of selectedShots) {
  await ensurePage();
  const url = `${BASE}${s.path}`;
  const out = join(outRoot, `${s.id}.png`);
  try {
    await setLocalStorage(page, s.auth !== false);
    // Re-apply layout state per shot (some pages reset chatSlug/rightCollapsed
    // on mount) -- keep chat open only for the one demo shot.
    await page.evaluate(
      (rightCollapsed) => {
        const raw = localStorage.getItem('tahti-web-layout');
        const parsed = raw ? JSON.parse(raw) : { state: {}, version: 3 };
        parsed.state.rightCollapsed = rightCollapsed;
        localStorage.setItem('tahti-web-layout', JSON.stringify(parsed));
      },
      s.id === CHAT_DEMO_SHOT_ID ? false : true,
    );
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    if (s.id === 'login-totp') {
      await page.getByLabel('Email').fill('demo+totp@tahti.live');
      await page.getByLabel('Password').fill('totp-demo');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByLabel('Authentication code').waitFor();
    }
    if (s.id === 'money-fan-subs') {
      await page.getByRole('tab', { name: 'Fan subs' }).click();
      await page
        .getByRole('region', { name: 'Fan subscription summary' })
        .waitFor();
    }
    await page.waitForTimeout(s.wait ?? 900);
    // Hide cookie/noise if any; capture main viewport
    await page.screenshot({ path: out, fullPage: false });
    console.log('ok', s.id, s.path);
  } catch (err) {
    console.error('fail', s.id, err.message);
    await ensurePage();
    try {
      await setLocalStorage(page, s.auth !== false);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: out, fullPage: false });
      console.log('ok-soft', s.id);
    } catch (e2) {
      console.error('skip', s.id, e2.message);
    }
  }
  await page.close().catch(() => {});
}

await browser.close();
console.log('done', outRoot);
