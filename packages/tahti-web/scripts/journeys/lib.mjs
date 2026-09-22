// Shared helpers for the 4 category e2e journeys (anonymous/listener/artist/admin).
//
// Runs against `VITE_FORCE_MOCK=1` — the app's built-in rich mock dataset
// (see src/api/mock*.ts), so there is no separate database seed step. Auth
// for the listener/artist/admin personas is either a real login (any
// email/password works in mock mode and yields an ARTIST account — see
// buildMockLoginUser in src/api/mock-session.ts) or, for personas the mock
// login can't produce (a channel-less listener, a board member), directly
// injected into the same localStorage-persisted zustand stores the app
// itself writes to (tahti-web-auth / tahti-web-layout / tahti-web-theme).
//
// Theme: `nuclear:tahti-dark` is the app's own branded skin and is
// deliberately never used for these captures (kept distinct from the
// light/dark axis being tested) — we pin themeId to `nuclear:default` and
// only vary `colorMode`.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

export const BASE = process.env.JOURNEY_BASE_URL ?? 'http://localhost:5195';
export const CHROMIUM_PATH = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium';

export const THEMES = (process.env.SCREENSHOT_THEMES ?? 'light,dark')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

export const VIEWPORT = { width: 3440, height: 1440 };

// Never 'nuclear:tahti-dark' — see file header.
const THEME_ID = 'nuclear:default';

const LAYOUT_STATE = {
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

let passed = 0;
let failed = 0;

export function ok(label) {
  console.log(`✓ ${label}`);
  passed++;
}

export function fail(label, err) {
  console.error(`✗ ${label}${err ? ` — ${err}` : ''}`);
  failed++;
}

function themeState(colorMode) {
  return {
    state: {
      themeId: THEME_ID,
      dark: colorMode === 'dark',
      colorMode,
      customThemes: {},
    },
    version: 0,
  };
}

/** Write auth/layout/theme straight into localStorage — same keys/shapes the
 * app's own zustand `persist` middleware writes. Call after the first
 * `page.goto` (localStorage needs an origin) and before navigating anywhere
 * that reads auth. */
export async function injectState(page, { authUser, colorMode }) {
  await page.evaluate(
    ({ authUser, layout, theme }) => {
      if (authUser) {
        localStorage.setItem(
          'tahti-web-auth',
          JSON.stringify({ state: { user: authUser }, version: 0 }),
        );
        localStorage.setItem(`tahti-web-onboarded:${authUser.id}`, '1');
      }
      localStorage.setItem('tahti-web-layout', JSON.stringify(layout));
      localStorage.setItem('tahti-web-theme', JSON.stringify(theme));
    },
    { authUser, layout: LAYOUT_STATE, theme: themeState(colorMode) },
  );
}

/** Real login through the UI (mock mode accepts any password and returns an
 * ARTIST account keyed off the email — see buildMockLoginUser). */
export async function signIn(page, email, password = 'demo-password') {
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page
    .getByRole('button', { name: /^Signed in as/ })
    .waitFor({ state: 'visible', timeout: 15_000 });
}

export async function shot(page, outDir, file, label) {
  await page.screenshot({ path: join(outDir, file), fullPage: true });
  ok(`screenshot ${file}`);
}

/** Visit a flat list of [path, id] pairs, one screenshot each. Used for the
 * exhaustive "every tab" sweeps (studio, admin). */
export async function sweepRoutes(page, outDir, routes) {
  for (const [routePath, id] of routes) {
    try {
      await page.goto(`${BASE}${routePath}`, {
        waitUntil: 'domcontentloaded',
        timeout: 20_000,
      });
      await page.waitForTimeout(700);
      await shot(page, outDir, `${id}.png`, id);
    } catch (e) {
      fail(`route ${routePath}`, e.message);
    }
  }
}

export async function runThemedJourney(outRoot, fn) {
  await mkdir(outRoot, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox'],
  });
  try {
    for (const theme of THEMES) {
      const outDir = join(outRoot, theme);
      await mkdir(outDir, { recursive: true });
      const context = await browser.newContext({ viewport: VIEWPORT });
      const page = await context.newPage();
      console.log(`\n── theme: ${theme} ──`);
      try {
        await fn(page, theme, outDir);
      } catch (e) {
        fail(`journey (${theme})`, e.message);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

/** Run a route sweep exactly once (single theme) — used where dozens of
 * pages would make a full light+dark pass excessive. */
export async function runSingleThemeSweep(outRoot, colorMode, fn) {
  await mkdir(outRoot, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox'],
  });
  try {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    await fn(page, colorMode, outRoot);
  } finally {
    await browser.close();
  }
}

export async function writeManifest(outDir, entries) {
  await writeFile(join(outDir, 'manifest.json'), JSON.stringify(entries, null, 2) + '\n');
}

export function summarize(name, outRoot) {
  console.log(`\n── ${name}: ${passed} passed, ${failed} failed ──`);
  console.log(`   Screenshots: ${outRoot}`);
  if (failed > 0) process.exitCode = 1;
}

/** Minimal valid WAV so the real upload flow has real bytes to send. */
export function makeSilentWav(seconds = 1, sampleRate = 8000) {
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
  return buffer;
}
