// Shared harness for the task-based journeys (listener-tasks / artist-tasks).
//
// Unlike the screenshot journeys, these run against a real backend (default
// https://beta.tahti.live) with real accounts, and perform tasks a person
// would actually do. Every task is timed and screenshotted, and while it runs
// the harness records console errors, uncaught exceptions, failed or slow
// /api responses and a small page audit (unnamed controls, horizontal
// overflow, h1 count). Results land in <out>/report.json and <out>/REPORT.md.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

export const BASE = (
  process.env.JOURNEY_BASE_URL ?? 'https://beta.tahti.live'
).replace(/\/$/, '');
export const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium';
const SLOW_MS = Number(process.env.JOURNEY_SLOW_MS ?? 2500);

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(2);
  }
  return value;
}

export async function createRun(outDir, { viewport }) {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const tasks = [];
  let current = null;
  let shotIndex = 0;

  const note = (kind, detail) => {
    if (current) current.signals.push({ kind, detail });
  };
  page.on('console', (m) => {
    if (m.type() === 'error') note('console', m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => note('exception', e.message.slice(0, 300)));
  const started = new Map();
  page.on('request', (r) => started.set(r, Date.now()));
  page.on('response', (r) => {
    const url = r.url();
    if (!url.includes('/api/')) return;
    const ms = Date.now() - (started.get(r.request()) ?? Date.now());
    const path = url.replace(/^https?:\/\/[^/]+/, '').slice(0, 160);
    const method = r.request().method();
    if (r.status() >= 400) note('api', `${r.status()} ${method} ${path}`);
    else if (ms > SLOW_MS) note('slow', `${ms}ms ${method} ${path}`);
  });

  async function shot(label) {
    shotIndex += 1;
    const file = `${String(shotIndex).padStart(2, '0')}-${label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)}.png`;
    await page
      .screenshot({ path: join(outDir, file), fullPage: false })
      .catch(() => {});
    if (current) current.shots.push(file);
    return file;
  }

  async function audit() {
    const result = await page
      .evaluate(() => {
        const visible = (e) => {
          const r = e.getBoundingClientRect();
          const s = getComputedStyle(e);
          return (
            r.width > 0 &&
            r.height > 0 &&
            s.visibility !== 'hidden' &&
            s.display !== 'none'
          );
        };
        const unnamed = [
          ...document.querySelectorAll('button, a[href], [role=button]'),
        ]
          .filter(visible)
          .filter(
            (e) =>
              !(
                e.getAttribute('aria-label') ||
                e.getAttribute('aria-labelledby') ||
                e.getAttribute('title') ||
                e.textContent.trim()
              ),
          )
          .map((e) => e.outerHTML.slice(0, 120));
        const unlabeled = [
          ...document.querySelectorAll('input:not([type=hidden]), textarea'),
        ]
          .filter(visible)
          .filter(
            (e) =>
              !(
                e.labels?.length ||
                e.getAttribute('aria-label') ||
                e.getAttribute('aria-labelledby')
              ),
          )
          .map((e) => e.outerHTML.slice(0, 120));
        return {
          url: location.pathname + location.search,
          title: document.title,
          h1: document.querySelectorAll('h1').length,
          overflowX:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 1,
          unnamed: unnamed.slice(0, 5),
          unlabeled: unlabeled.slice(0, 5),
        };
      })
      .catch(() => null);
    if (!result) return;
    if (result.h1 !== 1) note('audit', `${result.url}: ${result.h1} h1`);
    if (result.overflowX)
      note('audit', `${result.url}: horizontal page overflow`);
    for (const u of result.unnamed)
      note('audit', `${result.url}: unnamed control ${u}`);
    for (const u of result.unlabeled)
      note('audit', `${result.url}: unlabeled field ${u}`);
  }

  /** Run one user task. `fn` returns an optional note string; throwing marks
   * the task failed (a blocker). `ux(...)` inside fn records a non-blocking
   * friction finding. */
  async function task(name, fn) {
    current = {
      name,
      ok: true,
      ms: 0,
      notes: [],
      ux: [],
      signals: [],
      shots: [],
    };
    tasks.push(current);
    const t0 = Date.now();
    const ux = (msg) => current.ux.push(msg);
    try {
      const out = await fn({ page, ux, shot });
      if (out) current.notes.push(out);
      console.log(`✓ ${name}`);
    } catch (e) {
      current.ok = false;
      current.notes.push(
        String(e.message ?? e)
          .split('\n')[0]
          .slice(0, 300),
      );
      console.log(`✗ ${name} — ${current.notes.at(-1)}`);
    }
    current.ms = Date.now() - t0;
    await page.waitForTimeout(400);
    await audit();
    await shot(name);
    for (const u of current.ux) console.log(`   ~ ${u}`);
    current = null;
  }

  async function finish(title) {
    await browser.close();
    await writeFile(
      join(outDir, 'report.json'),
      JSON.stringify({ base: BASE, tasks }, null, 2) + '\n',
    );
    const lines = [
      `# ${title}`,
      '',
      `Target: ${BASE} · ${new Date().toISOString()}`,
      '',
    ];
    lines.push(
      '| Task | Result | Time | UX notes | Signals |',
      '| --- | --- | --- | --- | --- |',
    );
    for (const t of tasks) {
      const sig = [...new Set(t.signals.map((s) => s.kind))]
        .map((k) => `${k}×${t.signals.filter((s) => s.kind === k).length}`)
        .join(' ');
      lines.push(
        `| ${t.name} | ${t.ok ? 'ok' : `**FAIL** ${t.notes.join('; ')}`} | ${(t.ms / 1000).toFixed(1)}s | ${t.ux.join('<br>')} | ${sig} |`,
      );
    }
    lines.push('', '## Signals', '');
    for (const t of tasks) {
      if (!t.signals.length) continue;
      lines.push(`### ${t.name}`, '');
      for (const s of [
        ...new Map(t.signals.map((s) => [s.kind + s.detail, s])).values(),
      ])
        lines.push(`- ${s.kind}: \`${s.detail.replace(/`/g, "'")}\``);
      lines.push('');
    }
    await writeFile(join(outDir, 'REPORT.md'), lines.join('\n') + '\n');
    const failed = tasks.filter((t) => !t.ok).length;
    console.log(
      `\n${tasks.length - failed}/${tasks.length} tasks ok → ${outDir}/REPORT.md`,
    );
  }

  return { page, context, task, shot, finish };
}

export async function signIn(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page
    .getByRole('button', { name: /^Signed in as/ })
    .waitFor({ state: 'visible', timeout: 20_000 });
}

export async function go(page, path) {
  await page.goto(`${BASE}${path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  await page
    .waitForLoadState('networkidle', { timeout: 8_000 })
    .catch(() => {});
}

/** Scroll the main area to the bottom and back so lazily rendered sections
 * mount, then wait for `locator` to appear. */
export async function reveal(page, locator, timeout = 12_000) {
  await page.evaluate(async () => {
    const el =
      [...document.querySelectorAll('main, [data-scroll-root], *')].find(
        (e) =>
          e.scrollHeight > e.clientHeight + 50 &&
          getComputedStyle(e).overflowY !== 'visible',
      ) ?? document.scrollingElement;
    for (let y = 0; y <= el.scrollHeight; y += 400) {
      el.scrollTop = y;
      await new Promise((r) => setTimeout(r, 120));
    }
    el.scrollTop = 0;
  });
  await locator.first().waitFor({ state: 'attached', timeout });
}

/** A short 440 Hz tone, so uploads have real audible content. */
export function makeToneWav(seconds = 8, sampleRate = 22050) {
  const numSamples = seconds * sampleRate;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < numSamples; i++) {
    const v = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.2 * 32767;
    buffer.writeInt16LE(Math.round(v), 44 + i * 2);
  }
  return buffer;
}
