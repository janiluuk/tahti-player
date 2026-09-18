import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../docs/redesign-shots');
mkdirSync(outDir, { recursive: true });

const BASE = process.env.REDESIGN_BASE_URL || 'http://localhost:5180';

const layoutClosed = {
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

// Dark + amber ("nuclear:tahti-dark" -- the tahti.live pitch palette, see
// packages/themes/src/basic/tahti-dark.css), matching this script's own
// name instead of each viewer's default light theme (same theme + legacy
// bootstrap keys as capture-map-screens.mjs).
const THEME_STATE = {
  state: {
    themeId: 'nuclear:tahti-dark',
    dark: true,
    colorMode: 'dark',
    customThemes: {},
  },
  version: 0,
};

async function setDarkTheme() {
  await page.evaluate((theme) => {
    localStorage.setItem('tahti-web-theme', JSON.stringify(theme));
    localStorage.setItem('tahti-nuclear-theme-id', theme.state.themeId);
    localStorage.setItem('tahti-nuclear-dark', '1');
  }, THEME_STATE);
}

let browser = await chromium.launch({
  channel: 'chromium',
  args: ['--disable-dev-shm-usage', '--disable-gpu'],
});
let page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
let authed = false;

async function ensureChatClosed() {
  await page.evaluate((layout) => {
    localStorage.setItem('tahti-web-layout', JSON.stringify(layout));
  }, layoutClosed);
  const collapse = page.getByRole('button', { name: 'Collapse panel' });
  const count = await collapse.count();
  for (let i = count - 1; i >= 0; i -= 1) {
    const btn = collapse.nth(i);
    if (await btn.isVisible().catch(() => false)) {
      await btn.click().catch(() => {});
      break;
    }
  }
}

async function relaunch() {
  try {
    await browser.close();
  } catch {
    // already dead
  }
  browser = await chromium.launch({
    channel: 'chromium',
    args: ['--disable-dev-shm-usage', '--disable-gpu'],
  });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  if (boardAuthed) {
    boardAuthed = false;
    authed = false;
    await boardAuthAs();
  } else if (authed) {
    authed = false;
    await authAs();
  }
}

async function authAs() {
  if (authed) {
    return;
  }
  authed = true;
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((layout) => {
    localStorage.setItem(
      'tahti-web-auth',
      JSON.stringify({
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
      }),
    );
    localStorage.setItem('tahti-web-onboarded:mock-board-1', '1');
    localStorage.setItem('tahti-web-layout', JSON.stringify(layout));
  }, layoutClosed);
  await setDarkTheme();
}

let boardAuthed = false;

async function boardAuthAs() {
  boardAuthed = true;
  authed = true; // AdminGate re-derives from the same tahti-web-auth key.
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((layout) => {
    localStorage.setItem(
      'tahti-web-auth',
      JSON.stringify({
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
      }),
    );
    localStorage.setItem('tahti-web-onboarded:mock-board-1', '1');
    localStorage.setItem('tahti-web-layout', JSON.stringify(layout));
  }, layoutClosed);
  await setDarkTheme();
}

// [path, output filename] pairs — authenticated as the mock demo artist.
const authedShots = [
  ['/', 'listen-home-v1.png'],
  ['/radio', 'listen-radio-v1.png'],
  ['/library', 'listener-library-v1.png'],
  ['/messages', 'listener-messages-v1.png'],
  ['/more', 'map-more-v1.png'],
  ['/settings', 'settings-v1.png'],
  ['/settings/artist', 'settings-artist-v1.png'],
  ['/sources', 'sources-v1.png'],
  ['/sources/soundcloud', 'sources-detail-v1.png'],
  ['/status', 'status-v1.png'],
  ['/governance', 'governance-v1.png'],
  ['/help', 'help-v1.png'],
  ['/about', 'legal-about-v1.png'],
  ['/transparency', 'transparency-v1.png'],
  ['/venues', 'venues-v1.png'],
  ['/venues/register', 'venues-register-v1.png'],
  ['/whats-new', 'whats-new-v1.png'],
  ['/channel/demo', 'listen-channel-v1.png'],
  ['/u/demo', 'listen-artist-v1.png'],
  ['/subscribe/demo', 'subscribe-v1.png'],
  ['/r/dj-moonlight-release-2', 'listen-smartlink-v1.png'],
  ['/embed/c/demo', 'embed-channel-v1.png'],
  ['/studio', 'studio-home-v1.png'],
  ['/studio/go-live', 'studio-go-live-v1.png'],
  ['/studio/archive', 'studio-archive-v1.png'],
  ['/studio/archive/arch-mock-1', 'studio-archive-item-v1.png'],
  ['/studio/releases', 'studio-releases-v1.png'],
  ['/studio/collections', 'studio-collections-v1.png'],
  ['/studio/upload', 'studio-upload-v1.png'],
  ['/studio/editor', 'studio-editor-v1.png'],
  ['/studio/stash', 'studio-stash-v1.png'],
  ['/studio/schedule', 'studio-schedule-v1.png'],
  ['/studio/stats', 'studio-stats-v1.png'],
  ['/studio/stats/detail', 'studio-stats-detail-v1.png'],
  ['/studio/setup-channel', 'studio-setup-channel-v1.png'],
  ['/studio/channel', 'studio-channel-v1.png'],
  ['/studio/shows', 'studio-shows-v1.png'],
  ['/studio/playlists', 'studio-playlists-v1.png'],
  ['/studio/updates', 'studio-updates-v1.png'],
  ['/studio/revenue', 'studio-revenue-v1.png'],
  ['/studio/distribution', 'studio-distribution-v1.png'],
  ['/studio/events', 'studio-events-v1.png'],
];

// Board-only admin surfaces — need isBoard:true, captured under a
// separate auth pass. Excludes filenames implying a specific dynamic
// interaction state (admin-dashboard-expanded, admin-selects-preview,
// admin-top-lists-preview) — reverse-engineering those risks a
// misleading capture, same reasoning as the excluded listener/studio
// dynamic-state shots below.
const adminShots = [
  ['/admin', 'admin-dashboard-v1.png'],
  // Root README.md's Screenshots section links this exact filename.
  ['/admin', 'admin-dashboard-current-v1.png'],
  ['/admin/beta', 'admin-beta-v1.png'],
  ['/admin/users', 'admin-users-v1.png'],
  ['/admin/radio', 'admin-radio-v1.png'],
  ['/admin/radio-submissions', 'admin-radio-submissions-v1.png'],
  ['/admin/news', 'admin-news-v1.png'],
  ['/admin/tahti-selects', 'admin-selects-v1.png'],
  ['/admin/streams', 'admin-streams-v1.png'],
  ['/admin/support', 'admin-support-v1.png'],
  ['/admin/top-lists', 'admin-top-lists-v1.png'],
  ['/admin/announcements', 'admin-announcements-v1.png'],
  ['/admin/storage', 'admin-storage-v1.png'],
  ['/admin/files', 'admin-files-v1.png'],
  ['/admin/content-reports', 'admin-content-reports-v1.png'],
  ['/admin/financial', 'admin-financial-v1.png'],
  ['/admin/governance', 'admin-governance-v1.png'],
  ['/admin/feature-requests', 'admin-feature-requests-v1.png'],
  ['/admin/grants', 'admin-grants-v1.png'],
  ['/admin/agm', 'admin-agm-v1.png'],
  ['/admin/vendors', 'admin-vendors-v1.png'],
  ['/admin/status', 'admin-status-v1.png'],
  ['/admin/i18n', 'admin-i18n-v1.png'],
];

// Logged-out surfaces — capture before auth injection.
const loggedOutShots = [
  ['/login', 'auth-login-v1.png'],
  ['/join', 'auth-join-v1.png'],
];

const results = [];

async function captureOnce(path, out) {
  await page.goto(`${BASE}${path}`, {
    waitUntil: 'networkidle',
    timeout: 20000,
  });
  await ensureChatClosed();
  await page.waitForTimeout(1200);
  await ensureChatClosed();
  const text = await page.locator('body').innerText();
  const outPath = join(outDir, out);
  await page.screenshot({ path: outPath, fullPage: true });
  return text.slice(0, 120).replace(/\n/g, ' ');
}

async function capture(path, out, retried = false) {
  try {
    const snippet = await captureOnce(path, out);
    console.log(`OK\t${out}\t${path}\t${snippet}`);
    results.push({ path, out, snippet, ok: true });
  } catch (err) {
    if (!retried) {
      console.log(`RETRY\t${out}\t${path}\t${err.message.slice(0, 150)}`);
      await relaunch();
      await capture(path, out, true);
      return;
    }
    console.log(`FAIL\t${out}\t${path}\t${err.message.slice(0, 200)}`);
    results.push({ path, out, ok: false });
  }
}

await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await setDarkTheme();

for (const [path, out] of loggedOutShots) {
  await capture(path, out);
}

await authAs();

for (const [path, out] of authedShots) {
  await capture(path, out);
}

await boardAuthAs();

for (const [path, out] of adminShots) {
  await capture(path, out);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} captured.`);
if (failed.length) {
  console.log('Failed:', failed.map((f) => f.out).join(', '));
}

await browser.close();
