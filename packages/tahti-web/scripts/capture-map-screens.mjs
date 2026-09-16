import { mkdirSync, readdirSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
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
  // ── Anonymous / public ──────────────────────────────────────────────────
  { id: 'listen', path: '/', auth: false },
  { id: 'radio', path: '/radio', auth: false },
  { id: 'discover', path: '/discover', auth: false },
  { id: 'channel', path: `/channel/${CHANNEL}`, auth: false },
  { id: 'channel-chat', path: `/chat/${CHANNEL}`, auth: false },
  { id: 'chat-general', path: '/chat', auth: false },
  { id: 'profile', path: `/u/${USER}`, auth: false },
  { id: 'collection', path: `/u/${USER}/c/demo-collection`, auth: false },
  { id: 'smart-link', path: '/r/demo-release', auth: false },
  { id: 'subscribe', path: `/subscribe/${USER}`, auth: false },
  { id: 'green-room', path: `/u/${USER}/green-room`, auth: false },
  { id: 'embed', path: `/embed/c/${CHANNEL}`, auth: false },
  { id: 'embed-collection', path: '/embed/col/demo-collection', auth: false },
  { id: 'embed-release', path: '/embed/r/demo-release', auth: false },
  {
    id: 'embed-user-channel',
    path: `/embed/u/${USER}/c/${CHANNEL}`,
    auth: false,
  },
  { id: 'login', path: '/login', auth: false },
  { id: 'login-totp', path: '/login', auth: false },
  { id: 'join', path: '/join', auth: false },
  { id: 'apply', path: '/apply', auth: false },
  { id: 'signup', path: '/signup', auth: false },
  { id: 'signup-payment', path: '/signup/payment', auth: false },
  { id: 'forgot-password', path: '/forgot-password', auth: false },
  { id: 'reset-password', path: '/reset-password', auth: false },
  { id: 'setup-password', path: '/setup-password', auth: false },
  { id: 'verify', path: '/verify', auth: false },
  { id: 'onboarding', path: '/onboarding', auth: false },
  { id: 'venues', path: '/venues', auth: false },
  { id: 'venues-register', path: '/venues/register', auth: false },
  { id: 'governance', path: '/governance' },
  { id: 'governance-feature-requests', path: '/governance/feature-requests' },
  { id: 'about', path: '/about', auth: false },
  { id: 'for-artists', path: '/for-artists', auth: false },
  { id: 'how-it-works', path: '/how-it-works', auth: false },
  { id: 'what-is-it', path: '/what-is-it', auth: false },
  { id: 'whats-new', path: '/whats-new', auth: false },
  { id: 'privacy', path: '/privacy', auth: false },
  { id: 'terms', path: '/terms', auth: false },
  { id: 'agpl', path: '/agpl', auth: false },
  { id: 'help', path: '/help', auth: false },
  { id: 'help-topic', path: '/help/getting-around', auth: false },
  {
    id: 'help-keyboard-shortcuts',
    path: '/help/keyboard-shortcuts',
    auth: false,
  },
  { id: 'status', path: '/status', auth: false },
  { id: 'transparency', path: '/transparency', auth: false },
  { id: 'transparency-methodology', path: '/transparency/methodology' },
  { id: 't-shortlink', path: `/t/${CHANNEL}-archive-1`, auth: false },
  { id: 'v-shortlink', path: '/v/demo-release', auth: false },
  { id: 'c-shortlink', path: `/c/${CHANNEL}`, auth: false },

  // ── Listener / member ────────────────────────────────────────────────────
  { id: 'library', path: '/library' },
  { id: 'library-sounds', path: '/library/sounds' },
  { id: 'library-collections', path: '/library/collections' },
  { id: 'library-recordings', path: '/library/recordings' },
  { id: 'library-smartlinks', path: '/library/smartlinks' },
  { id: 'library-favorites', path: '/library/favorites' },
  { id: 'library-history', path: '/library/history' },
  { id: 'library-upload', path: '/library/upload' },
  { id: 'library-media', path: '/library/media' },
  { id: 'feed', path: '/feed' },
  { id: 'listen-feed', path: '/listen/feed' },
  { id: 'history', path: '/history' },
  { id: 'listen-history', path: '/listen/history' },
  { id: 'favorites', path: '/favorites' },
  { id: 'listen-favorites', path: '/favorites' },
  { id: 'listener-dashboard', path: '/dashboard' },
  { id: 'account', path: '/account' },
  { id: 'messages', path: '/messages' },
  { id: 'messages-thread', path: '/messages/demo-thread' },
  { id: 'schedule-page', path: '/schedule' },
  { id: 'settings', path: '/settings' },
  { id: 'settings-section', path: '/settings/artist' },
  { id: 'settings-themes', path: '/settings/themes' },
  { id: 'settings-addons', path: '/settings/plugin-store' },
  { id: 'settings-audience', path: '/settings/audience' },
  { id: 'money-tiers', path: '/settings/audience' },
  { id: 'money-fan-subs', path: '/settings/audience' },
  { id: 'settings-account', path: '/settings/account' },
  {
    id: 'settings-notifications',
    path: '/settings/account?tab=notifications',
  },
  { id: 'sources', path: '/settings/plugin-store?category=import' },
  { id: 'radio-show', path: `/radio/show/${CHANNEL}` },

  // ── Artist / Studio ──────────────────────────────────────────────────────
  { id: 'studio', path: '/studio' },
  { id: 'go-live', path: '/studio/go-live' },
  { id: 'archive', path: '/studio/sounds' },
  { id: 'archive-item', path: '/studio/sounds/arch-mock-1' },
  { id: 'archive-item-editor', path: '/studio/sounds/arch-mock-1/editor' },
  { id: 'releases', path: '/studio/releases' },
  { id: 'release-detail', path: '/studio/releases/rel-mock-1' },
  { id: 'collections', path: '/studio/collections' },
  { id: 'collection-edit', path: '/studio/collections/demo-collection' },
  { id: 'editor', path: '/studio/editor' },
  { id: 'editor-track', path: '/studio/editor/arch-mock-1' },
  { id: 'mastering', path: '/studio/mastering/arch-mock-1' },
  { id: 'upload', path: '/studio/upload' },
  { id: 'stash', path: '/studio/stash' },
  { id: 'schedule', path: '/studio/schedule' },
  { id: 'shows', path: '/studio/shows' },
  { id: 'show-detail', path: '/studio/shows/show-mock-1' },
  { id: 'show-episode', path: '/studio/shows/episodes/ep-mock-1' },
  { id: 'stats', path: '/studio/stats' },
  { id: 'stats-detail-alias', path: '/studio/stats/detail' },
  { id: 'stats-detail', path: '/studio/insights/archive/arch-mock-1' },
  { id: 'insights', path: '/studio/insights' },
  { id: 'channel-design', path: '/studio/channel' },
  { id: 'studio-channel-radio', path: '/studio/channel?tab=radio' },
  {
    id: 'studio-channel-multicast',
    path: '/studio/channel?tab=multicast',
  },
  { id: 'studio-governance', path: '/studio/governance' },
  { id: 'studio-events', path: '/studio/events' },
  { id: 'studio-event-new', path: '/studio/events/new' },
  { id: 'studio-branding', path: '/studio/branding' },
  { id: 'studio-recordings', path: '/studio/recordings' },
  { id: 'studio-moderation', path: '/studio/moderation' },
  { id: 'setup-channel-gated', path: '/studio/channel?tab=setup' },
  { id: 'updates', path: '/studio/updates' },
  { id: 'revenue', path: '/studio/revenue' },
  { id: 'stripe', path: '/studio/stripe' },
  { id: 'distribution', path: '/studio/distribution' },

  // ── Admin ────────────────────────────────────────────────────────────────
  { id: 'admin', path: '/admin' },
  { id: 'admin-financial', path: '/admin/financial' },
  { id: 'admin-storage', path: '/admin/storage' },
  { id: 'admin-storage-user', path: '/admin/storage/demo-user-id' },
  { id: 'admin-logs', path: '/admin/logs' },
  { id: 'admin-content', path: '/admin/content' },
  { id: 'admin-moderation', path: '/admin/moderation' },
  { id: 'admin-moderation-tab', path: '/admin/moderation/selects' },
  { id: 'admin-streams', path: '/admin/streams' },
  { id: 'admin-vendors', path: '/admin/vendors' },
  { id: 'admin-venues', path: '/admin/venues' },
  { id: 'admin-disco-widgets', path: '/admin/disco-widgets' },
  { id: 'admin-status', path: '/admin/status' },
  { id: 'admin-users', path: '/admin/users' },
  { id: 'admin-radio', path: '/admin/radio' },
  { id: 'admin-news', path: '/admin/news' },
  { id: 'admin-top-lists', path: '/admin/top-lists' },
  { id: 'admin-announcements', path: '/admin/announcements' },
  { id: 'admin-governance', path: '/admin/governance' },
  { id: 'admin-reports', path: '/admin/reports' },
  { id: 'admin-artwork-presets', path: '/admin/artwork-presets' },
  { id: 'admin-grants', path: '/admin/grants' },
  { id: 'admin-grants-year', path: '/admin/grants/2026' },
  { id: 'admin-agm', path: '/admin/agm' },
  { id: 'admin-i18n', path: '/admin/i18n' },
  { id: 'admin-map', path: '/admin/map' },
  { id: 'admin-tahti-selects', path: '/admin/tahti-selects' },
  {
    id: 'admin-radio-station-suggestions-orphan',
    path: '/admin/radio-station-suggestions',
  },
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
const startShotId = process.env.MAP_SHOT_START;
const startIndex = startShotId
  ? Math.max(
      0,
      shots.findIndex((shot) => shot.id === startShotId),
    )
  : 0;
const shotsToCapture = requestedShotIds.size
  ? selectedShots
  : shots.slice(startIndex);

// MAP_VIEWPORT=mobile switches every capture in this run to a phone
// viewport and suffixes output filenames with `--mobile` so desktop shots
// are never overwritten -- run the script twice (default, then
// MAP_VIEWPORT=mobile) to get both.
const MOBILE = process.env.MAP_VIEWPORT === 'mobile';
const VIEWPORT = MOBILE
  ? { width: 390, height: 844 }
  : { width: 1280, height: 800 };
const DEVICE_SCALE_FACTOR = MOBILE ? 2 : 1;

let browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
let page = await browser.newPage({
  viewport: VIEWPORT,
  deviceScaleFactor: DEVICE_SCALE_FACTOR,
  isMobile: MOBILE,
  hasTouch: MOBILE,
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
      isBoard: true,
      membershipStatus: 'ACTIVE',
      channel: { slug: CHANNEL, state: 'LIVE' },
    },
  },
  version: 0,
};

// Dark + amber ("nuclear:tahti-dark" -- the tahti.live pitch palette, see
// packages/themes/src/basic/tahti-dark.css) for every map capture, matching
// this leaf's request instead of each viewer's default light theme.
const THEME_STATE = {
  state: {
    themeId: 'nuclear:tahti-dark',
    dark: true,
    colorMode: 'dark',
    customThemes: {},
  },
  version: 0,
};

/** Keep the right rail closed in the map: these are page/surface references,
 * not chat screenshots. This also prevents a page mount from reopening chat
 * and obscuring the content being documented. */

async function setLocalStorage(p, signedIn = true) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await p.evaluate(
        ({ auth, theme, rightCollapsed, signedIn: shouldSignIn }) => {
          if (shouldSignIn) {
            localStorage.setItem('tahti-web-auth', JSON.stringify(auth));
          } else {
            localStorage.removeItem('tahti-web-auth');
          }
          // Mark this mock user as already onboarded -- otherwise every
          // authenticated shot gets hijacked by a redirect to /onboarding.
          localStorage.setItem(
            `tahti-web-onboarded:${auth.state.user.id}`,
            '1',
          );
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
          localStorage.setItem('tahti-web-theme', JSON.stringify(theme));
          // Legacy keys the theme store's early index.html bootstrap reads
          // before zustand rehydrates -- see plugins/themes/store.ts.
          localStorage.setItem('tahti-nuclear-theme-id', theme.state.themeId);
          localStorage.setItem('tahti-nuclear-dark', '1');
        },
        { auth: AUTH_STATE, theme: THEME_STATE, rightCollapsed: true, signedIn },
      );
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
      await p.waitForTimeout(300);
    }
  }
}

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(500);
await setLocalStorage(page);

async function ensurePage() {
  if (!browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  if (page.isClosed()) {
    page = await browser.newPage({
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
      isMobile: MOBILE,
      hasTouch: MOBILE,
    });
    try {
      await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
    } catch {
      await page.waitForTimeout(1500);
      await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
    }
  }
}

async function ensureChatClosed() {
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-layout');
    const parsed = raw ? JSON.parse(raw) : { state: {}, version: 3 };
    parsed.state.rightCollapsed = true;
    localStorage.setItem('tahti-web-layout', JSON.stringify(parsed));
  });
}

async function waitForContent() {
  await page
    .locator('main')
    .waitFor({ state: 'visible', timeout: 2500 })
    .catch(() => {});
  await page.waitForFunction(
    () => {
      const text = document.body.innerText.trim();
      return text.length > 80 && !/^Loading(?:…|\.\.\.)?$/m.test(text);
    },
    undefined,
    { timeout: 8000 },
  );
}

function tabFilePart(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

const IN_PAGE_TAB_SHOT_IDS = new Set([
  'settings',
  'settings-section',
  'settings-themes',
  'settings-addons',
  'settings-audience',
  'settings-account',
  'settings-notifications',
  'money-tiers',
  'money-fan-subs',
  'sources',
  'help',
  'library',
  'library-collections',
  'library-sounds',
  'studio-channel',
  'studio-channel-radio',
  'studio-channel-multicast',
  'studio-events',
  'studio-governance',
  'admin-moderation',
  'admin-moderation-tab',
  'archive-item',
]);

async function captureInPageTabs(out, shotId) {
  if (!IN_PAGE_TAB_SHOT_IDS.has(shotId)) {
    return;
  }
  const tabRoot = shotId.startsWith('settings')
    ? page.locator('[role="dialog"]')
    : page.locator('main');
  const tabs = tabRoot.locator('[role="tab"]:visible');
  const count = await tabs.count();
  const seen = new Set();
  for (let index = 0; index < count; index += 1) {
    const tab = tabs.nth(index);
    const label = (await tab.innerText().catch(() => 'tab')).trim();
    const key = `${index}-${tabFilePart(label) || 'tab'}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    await tab.click().catch(() => {});
    await page.waitForTimeout(350);
    await ensureChatClosed();
    await waitForContent();
    await page.screenshot({
      path: join(outRoot, `${basename(out, '.png')}--${key}.png`),
      fullPage: false,
    });
  }
}

for (const s of shotsToCapture) {
  await ensurePage();
  const url = `${BASE}${s.path}`;
  const out = join(outRoot, MOBILE ? `${s.id}--mobile.png` : `${s.id}.png`);
  try {
    await setLocalStorage(page, s.auth !== false);
    // Re-apply layout state per shot (some pages reset chatSlug/rightCollapsed
    // on mount) -- keep chat open only for the one demo shot.
    await page.evaluate((rightCollapsed) => {
      const raw = localStorage.getItem('tahti-web-layout');
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 3 };
      parsed.state.rightCollapsed = rightCollapsed;
      localStorage.setItem('tahti-web-layout', JSON.stringify(parsed));
    }, true);
    await page.goto(url, { waitUntil: 'commit', timeout: 5000 });
    if (s.id === 'login-totp') {
      await page.getByLabel('Email').fill('demo+totp@tahti.live');
      await page.getByLabel('Password').fill('totp-demo');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.getByLabel('Authentication code').waitFor({ timeout: 3000 });
    }
    if (s.id === 'money-fan-subs') {
      await page.getByRole('tab', { name: 'Fan subs' }).click();
      await page
        .getByRole('region', { name: 'Fan subscription summary' })
        .waitFor();
    }
    if (s.id === 'settings-notifications') {
      await page
        .getByRole('tab', { name: /Notifications/i })
        .first()
        .click();
      await page.getByRole('heading', { name: /notifications/i }).waitFor();
    }
    if (s.path.startsWith('/settings')) {
      await page
        .getByText('Themes', { exact: true })
        .first()
        .waitFor({ timeout: 5000 })
        .catch(() => {});
    }
    await page.waitForTimeout(s.wait ?? 300);
    await waitForContent();
    // Hide cookie/noise if any; capture main viewport
    await page.screenshot({ path: out, fullPage: false });
    await captureInPageTabs(out, s.id);
    console.log('ok', s.id, s.path);
  } catch (err) {
    console.error('fail', s.id, err.message);
    await ensurePage();
    try {
      await setLocalStorage(page, s.auth !== false);
      await page.goto(url, { waitUntil: 'commit', timeout: 5000 });
      await page.waitForTimeout(500);
      await waitForContent();
      await page.screenshot({ path: out, fullPage: false });
      console.log('ok-soft', s.id);
    } catch (e2) {
      console.error('skip', s.id, e2.message);
    }
  }
  await page.close().catch(() => {});
}

await browser.close();
const imageFiles = readdirSync(outRoot)
  .filter((fileName) => fileName.endsWith('.png'))
  .sort();
writeFileSync(
  join(outRoot, 'sitemap.json'),
  `${JSON.stringify(
    {
      surface: 'nuclear',
      capturedAt: '2026-09-04',
      baseUrl: BASE,
      images: imageFiles.map((fileName) => ({
        file: fileName,
        url: `/map/nuclear/${fileName}`,
      })),
    },
    null,
    2,
  )}\n`,
);
console.log('done', outRoot);
