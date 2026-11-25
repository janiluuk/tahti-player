/**
 * Cold-cache Cumulative Layout Shift for a tahti-web route (Listen `/` by
 * default) at desktop and phone width, with the elements that shifted.
 *
 * Serve the app first, either a production build (realistic chunks):
 *
 *   pnpm --filter @tahti-player/tahti-web exec vite build --outDir /tmp/tw-dist
 *   pnpm --filter @tahti-player/tahti-web exec vite preview --outDir /tmp/tw-dist --port 5194
 *
 * or the mock app (instant fixtures, unbundled modules):
 *
 *   VITE_FORCE_MOCK=1 pnpm --filter @tahti-player/tahti-web exec vite --port 5194
 *
 * then run:
 *
 *   node packages/tahti-web/scripts/measure-listen-cls.mjs
 *
 * Env:
 *   CLS_BASE_URL     app origin (default http://127.0.0.1:5194)
 *   CLS_PATH         route to load (default /)
 *   CLS_RUNS         fresh-context loads per width (default 3)
 *   CLS_API_ORIGIN   where `/tahti-api/*` is forwarded, since `vite preview`
 *                    has no proxy (default https://api.tahti.live)
 *   CLS_API_DELAY_MS base delay added to every API response; each request
 *                    gets base + up to base extra so sections land at
 *                    different times (default 400, 0 disables)
 *   CLS_THROTTLE     `0` disables the Fast-4G network + 4x CPU throttle
 *   CLS_SETTLE_MS    wait after network idle before reading (default 2500)
 *   CLS_JSON         path to also write the raw results as JSON
 *   CLS_SHOT_DIR     directory for a full-page screenshot per width
 *   CLS_STORAGE      JSON object of localStorage keys to seed before load
 *                    (e.g. a signed-in `tahti-web-auth` for the mock app)
 */
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const BASE = (process.env.CLS_BASE_URL || 'http://127.0.0.1:5194').replace(
  /\/$/,
  '',
);
const ROUTE = process.env.CLS_PATH || '/';
const RUNS = Number(process.env.CLS_RUNS || 3);
const API_ORIGIN = (
  process.env.CLS_API_ORIGIN || 'https://api.tahti.live'
).replace(/\/$/, '');
const API_DELAY_MS = Number(process.env.CLS_API_DELAY_MS ?? 400);
const THROTTLE = process.env.CLS_THROTTLE !== '0';
const SETTLE_MS = Number(process.env.CLS_SETTLE_MS || 2500);

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true },
];

const observerScript = () => {
  const describe = (node) => {
    if (!node || node.nodeType !== 1) {
      return node?.nodeName ?? 'unknown';
    }
    const parts = [];
    let el = node;
    for (let depth = 0; el && el.nodeType === 1 && depth < 4; depth += 1) {
      const testId = el.getAttribute('data-testid');
      const cls = (el.getAttribute('class') || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .join('.');
      parts.unshift(
        `${el.tagName.toLowerCase()}${testId ? `[data-testid=${testId}]` : ''}${
          !testId && cls ? `.${cls}` : ''
        }`,
      );
      if (testId) {
        break;
      }
      el = el.parentElement;
    }
    const nearest = node.closest?.('[data-testid]');
    const nearestId = nearest?.getAttribute('data-testid');
    return nearestId && !parts[0].includes(nearestId)
      ? `[${nearestId}] … ${parts.join(' > ')}`
      : parts.join(' > ');
  };
  const rect = (r) =>
    r
      ? [
          Math.round(r.x),
          Math.round(r.y),
          Math.round(r.width),
          Math.round(r.height),
        ]
      : null;
  window.__cls = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__cls.push({
        value: entry.value,
        startTime: Math.round(entry.startTime),
        hadRecentInput: entry.hadRecentInput,
        sources: (entry.sources || []).map((source) => ({
          node: describe(source.node),
          from: rect(source.previousRect),
          to: rect(source.currentRect),
        })),
      });
    }
  }).observe({ type: 'layout-shift', buffered: true });
};

/** CLS as Chrome reports it: the largest session window (gap < 1 s,
 * window < 5 s) of shifts without recent input. */
function sessionWindowCls(entries) {
  let best = 0;
  let current = 0;
  let windowStart = 0;
  let previous = -Infinity;
  for (const entry of entries.filter((e) => !e.hadRecentInput)) {
    if (
      entry.startTime - previous > 1000 ||
      entry.startTime - windowStart > 5000
    ) {
      current = 0;
      windowStart = entry.startTime;
    }
    current += entry.value;
    previous = entry.startTime;
    best = Math.max(best, current);
  }
  return best;
}

async function measureOnce(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile ?? false,
    hasTouch: viewport.hasTouch ?? false,
    deviceScaleFactor: 1,
  });
  await context.addInitScript(observerScript);
  if (process.env.CLS_STORAGE) {
    await context.addInitScript((seed) => {
      if (sessionStorage.getItem('__clsSeeded')) {
        return;
      }
      sessionStorage.setItem('__clsSeeded', '1');
      for (const [key, value] of Object.entries(JSON.parse(seed))) {
        localStorage.setItem(
          key,
          typeof value === 'string' ? value : JSON.stringify(value),
        );
      }
    }, process.env.CLS_STORAGE);
  }
  await context.route('**/tahti-api/**', async (route) => {
    const url = new URL(route.request().url());
    if (API_DELAY_MS > 0) {
      const delay = API_DELAY_MS + Math.random() * API_DELAY_MS;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    const target = `${API_ORIGIN}${url.pathname.replace(/^\/tahti-api/, '')}${url.search}`;
    try {
      const response = await route.fetch({ url: target });
      if (!response.ok() && process.env.CLS_DEBUG) {
        console.log(`  api ${response.status()} ${url.pathname}`);
      }
      await route.fulfill({ response });
    } catch {
      await route.abort();
    }
  });
  const page = await context.newPage();
  if (THROTTLE) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (9 * 1024 * 1024) / 8,
      uploadThroughput: (1.5 * 1024 * 1024) / 8,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load', timeout: 120_000 });
  await page
    .waitForLoadState('networkidle', { timeout: 30_000 })
    .catch(() => undefined);
  await page.waitForTimeout(SETTLE_MS);
  const entries = await page.evaluate(() => window.__cls);
  if (process.env.CLS_SHOT_DIR) {
    await page.screenshot({
      path: `${process.env.CLS_SHOT_DIR}/${viewport.name}.png`,
      fullPage: true,
    });
  }
  await context.close();
  return entries;
}

function aggregate(entries) {
  const byNode = new Map();
  for (const entry of entries.filter((e) => !e.hadRecentInput)) {
    const share = entry.value / Math.max(entry.sources.length, 1);
    for (const source of entry.sources) {
      const row = byNode.get(source.node) ?? {
        node: source.node,
        score: 0,
        count: 0,
        example: source,
        at: entry.startTime,
      };
      row.score += share;
      row.count += 1;
      byNode.set(source.node, row);
    }
  }
  return [...byNode.values()].sort((a, b) => b.score - a.score);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const results = [];
for (const viewport of VIEWPORTS) {
  const runs = [];
  for (let run = 0; run < RUNS; run += 1) {
    const entries = await measureOnce(browser, viewport);
    runs.push({
      cls: sessionWindowCls(entries),
      total: entries
        .filter((e) => !e.hadRecentInput)
        .reduce((sum, e) => sum + e.value, 0),
      entries,
    });
  }
  const sorted = [...runs].sort((a, b) => a.cls - b.cls);
  const median = sorted[Math.floor(sorted.length / 2)];
  const worst = sorted[sorted.length - 1];
  results.push({ viewport: viewport.name, runs });

  console.log(
    `\n${viewport.name} ${viewport.width}x${viewport.height}  CLS median ${median.cls.toFixed(4)}  worst ${worst.cls.toFixed(4)}  runs [${runs
      .map((r) => r.cls.toFixed(4))
      .join(', ')}]`,
  );
  console.log(
    '  top shifting elements (worst run, score share · count · first at ms · from→to [x,y,w,h]):',
  );
  for (const row of aggregate(worst.entries).slice(0, 12)) {
    console.log(
      `   ${row.score.toFixed(4)} · ${row.count} · ${row.at}ms · ${row.node}  ${JSON.stringify(row.example.from)}→${JSON.stringify(row.example.to)}`,
    );
  }
}
await browser.close();

if (process.env.CLS_JSON) {
  writeFileSync(process.env.CLS_JSON, JSON.stringify(results, null, 2));
}
