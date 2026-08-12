import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outRoot = join(__dirname, '../public/map/nuclear');
mkdirSync(outRoot, { recursive: true });

const BASE = process.env.MAP_BASE_URL || 'https://beta.tahti.live';
const CHANNEL = process.env.MAP_CHANNEL || 'liis-kask-ee';
// username often equals slug prefix before -ee/-fi
const USER = process.env.MAP_USER || CHANNEL.replace(/-(ee|fi|vn|lv|se|no|dk)$/, '');

/** @type {{ id: string; path: string; wait?: number }[]} */
const shots = [
  { id: 'listen', path: '/' },
  { id: 'radio', path: '/radio' },
  { id: 'channel', path: `/channel/${CHANNEL}` },
  { id: 'profile', path: `/u/${USER}` },
  { id: 'subscribe', path: `/subscribe/${USER}` },
  { id: 'login', path: '/login' },
  { id: 'join', path: '/join' },
  { id: 'verify', path: '/verify' },
  { id: 'library', path: '/library' },
  { id: 'governance', path: '/governance' },
  { id: 'settings', path: '/settings' },
  { id: 'sources', path: '/sources' },
  { id: 'studio', path: '/studio' },
  { id: 'go-live', path: '/studio/go-live' },
  { id: 'archive', path: '/studio/archive' },
  { id: 'collections', path: '/studio/collections' },
  { id: 'upload', path: '/studio/upload' },
  { id: 'stash', path: '/studio/stash' },
  { id: 'stats', path: '/studio/stats' },
  { id: 'stats-detail', path: '/studio/stats/detail' },
  { id: 'more', path: '/more' },
  { id: 'help', path: '/help' },
  { id: 'status', path: '/status' },
  { id: 'transparency', path: '/transparency' },
];

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
});

for (const s of shots) {
  const url = `${BASE}${s.path}`;
  const out = join(outRoot, `${s.id}.png`);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(s.wait ?? 900);
    // Hide cookie/noise if any; capture main viewport
    await page.screenshot({ path: out, fullPage: false });
    console.log('ok', s.id, s.path);
  } catch (err) {
    console.error('fail', s.id, err.message);
    // Still try a quick load screenshot
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: out, fullPage: false });
      console.log('ok-soft', s.id);
    } catch (e2) {
      console.error('skip', s.id, e2.message);
    }
  }
}

await browser.close();
console.log('done', outRoot);
