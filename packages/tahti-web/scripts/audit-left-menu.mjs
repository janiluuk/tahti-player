// Visits every route the map capture knows (plus a few more), signed in and
// signed out, and lists the ones without the left menu. Embeds are takeover
// pages and are expected in the list. Run against the mock app:
//   VITE_FORCE_MOCK=1 pnpm dev:tahti
//   BASE=http://127.0.0.1:5173 node packages/tahti-web/scripts/audit-left-menu.mjs
import { readFileSync } from 'fs';
import { chromium } from '@playwright/test';

const src = readFileSync(
  new URL('./capture-map-screens.mjs', import.meta.url),
  'utf8',
);
const vars = {
  CHANNEL: 'liis-kask-ee',
  USER: 'liis-kask',
  RADIO_SHOW: 'demo',
  VENUE: 'kuudes-linja',
  EVENT_ID: 'evt-mock-1',
  TAG: 'ambient',
};
const paths = new Set();
for (const m of src.matchAll(/path:\s*(?:'([^']+)'|`([^`]+)`)/g)) {
  let p = m[1] ?? m[2];
  p = p.replace(/\$\{(\w+)\}/g, (_, k) => vars[k] ?? 'x');
  paths.add(p);
}
for (const extra of [
  '/u/liis-kask',
  '/u/liis-kask/c/demo-collection',
  '/u/liis-kask/green-room',
  '/t/arch-mock-1',
  '/radio/station/radio-helsinki',
  '/messages',
  '/jam',
  '/search?q=a',
  '/c/demo-collection',
  '/v/kuudes-linja',
  '/subscribe/liis-kask',
  '/favorites',
  '/listen/history',
  '/feed',
  '/help/support',
  '/more',
  '/schedule',
  '/chat',
  '/account',
]) {
  paths.add(extra);
}
const b = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
});
const base = process.env.BASE || 'http://127.0.0.1:5173';
const run = async (signedIn) => {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  let p = await ctx.newPage();
  await p.goto(base + '/');
  await p.evaluate((s) => {
    if (s) {
      localStorage.setItem(
        'tahti-web-auth',
        JSON.stringify({
          state: {
            user: {
              id: 'mock-1',
              email: 'demo@tahti.live',
              username: 'liis-kask',
              displayName: 'Mart Saar',
              role: 'BOARD',
              isBoard: true,
              membershipStatus: 'ACTIVE',
              channel: { slug: 'liis-kask-ee', state: 'LIVE' },
            },
          },
          version: 0,
        }),
      );
      localStorage.setItem('tahti-web-onboarded:mock-1', '1');
    } else {
      localStorage.removeItem('tahti-web-auth');
    }
  }, signedIn);
  const missing = [];
  for (const path of paths) {
    try {
      await p.goto(base + path, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });
      await p.waitForTimeout(1200);
      const has = await p.evaluate(() =>
        [...document.querySelectorAll('a')].some((a) => {
          const t = a.textContent.trim();
          const r = a.getBoundingClientRect();
          return (
            (t === 'Discover' || a.getAttribute('aria-label') === 'Discover') &&
            r.width > 0 &&
            r.left < 300
          );
        }),
      );
      if (!has) {
        missing.push(`${path} -> ${new URL(p.url()).pathname}`);
      }
    } catch (e) {
      missing.push(`${path} ERROR ${e.message.split('\n')[0].slice(0, 90)}`);
      await p.close().catch(() => {});
      p = await ctx.newPage();
    }
  }
  await ctx.close();
  return missing;
};
console.log('routes checked:', paths.size);
console.log('SIGNED IN, no left menu:\n' + (await run(true)).join('\n'));
console.log('SIGNED OUT, no left menu:\n' + (await run(false)).join('\n'));
await b.close();
