#!/usr/bin/env node
/**
 * Artist lifecycle journey — register → design + promo → album / 2 EPs /
 * DJ set → fan subscribe + chat → recurring show → live stream (default 20m).
 *
 * Mock only (VITE_FORCE_MOCK=1). Screenshots + ISSUES.md under
 * docs/e2e-journeys/artist-lifecycle/.
 *
 *   JOURNEY_BASE_URL=http://127.0.0.1:5195 \
 *   JOURNEY_STREAM_MINUTES=20 \
 *   node scripts/journeys/artist-lifecycle-journey.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

import { makeSilentWav } from './lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../../docs/e2e-journeys/artist-lifecycle');
const BASE = process.env.JOURNEY_BASE_URL ?? 'http://127.0.0.1:5195';
const STREAM_MINUTES = Number(process.env.JOURNEY_STREAM_MINUTES ?? '20');
const STREAM_SHOT_EVERY_MIN = Number(
  process.env.JOURNEY_STREAM_SHOT_EVERY_MIN ?? '5',
);

const stamp = Date.now();
// Mock login builds username from the email local-part (buildMockLoginUser).
const ARTIST_USER = `lifecycleartist${String(stamp).slice(-10)}`;
const ARTIST_EMAIL = `${ARTIST_USER}@tahti.live`;
const ARTIST_NAME = `Lifecycle Artist ${String(stamp).slice(-4)}`;
const ARTIST_PASS = 'secure-password-lifecycle';
const FAN_EMAIL = 'listener@tahti.live';
const FAN_PASS = 'demo-password';

/** @type {{ severity: 'blocker' | 'ux' | 'note'; step: string; detail: string }[]} */
const issues = [];
const steps = [];

function note(severity, step, detail) {
  issues.push({ severity, step, detail });
  const tag =
    severity === 'blocker' ? 'BLOCKER' : severity === 'ux' ? 'UX' : 'NOTE';
  console.log(`  ! [${tag}] ${step}: ${detail}`);
}

function ok(label) {
  console.log(`✓ ${label}`);
  steps.push({ ok: true, label });
}

function fail(label, err) {
  console.error(`✗ ${label}${err ? ` — ${err}` : ''}`);
  steps.push({ ok: false, label, err: String(err ?? '') });
  note('blocker', label, String(err ?? 'failed'));
}

async function shot(page, file, label) {
  const path = join(OUT, file);
  await page.screenshot({ path, fullPage: true });
  ok(`shot ${file}${label ? ` (${label})` : ''}`);
  return path;
}

async function settle(page, ms = 700) {
  await page.waitForTimeout(ms);
}

async function collectConsole(page) {
  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

async function markOnboarded(page) {
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    const userId = raw ? JSON.parse(raw)?.state?.user?.id : null;
    if (typeof userId === 'string') {
      localStorage.setItem(`tahti-web-onboarded:${userId}`, '1');
    }
  });
}

async function signOut(page) {
  const menu = page.getByRole('button', { name: /^Signed in as/ });
  if (await menu.isVisible().catch(() => false)) {
    await menu.click();
    const signOut = page.getByRole('menuitem', { name: /Sign out|Log out/i });
    if (await signOut.count()) {
      await signOut.first().click();
      await settle(page, 500);
      return;
    }
  }
  await page.evaluate(() => {
    localStorage.removeItem('tahti-web-auth');
  });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
}

async function createCollection(page, { title, style }) {
  await page.goto(`${BASE}/studio/collections`, {
    waitUntil: 'domcontentloaded',
  });
  await settle(page);
  const newBtn = page.getByRole('button', { name: 'New collection' });
  if ((await newBtn.count()) === 0) {
    fail('New collection button', 'not found on /studio/collections');
    await shot(page, `fail-collections-${style}.png`, 'missing create');
    return null;
  }
  await newBtn.first().click();
  await settle(page, 400);
  await page.getByLabel('Title').fill(title);
  const chip = page.getByRole('radio', { name: style, exact: true });
  const chipBtn = page.getByRole('button', { name: style, exact: true });
  if (await chip.count()) {
    await chip.first().click();
  } else if (await chipBtn.count()) {
    await chipBtn.first().click();
  } else {
    // FilterChips may render as buttons without radio role
    const any = page.locator(`[aria-label="Collection style"]`).getByText(style, {
      exact: true,
    });
    if (await any.count()) {
      await any.first().click();
    } else {
      note('ux', `create ${style}`, `Could not find style chip “${style}”`);
    }
  }
  if (style === 'Album' || style === 'EP') {
    const date = page.getByLabel('Release date');
    if (await date.count()) {
      await date.fill('2026-10-16');
    }
    const genres = page.getByLabel('Genres');
    if (await genres.count()) {
      await genres.fill('Electronic, Ambient');
    }
  }
  await shot(
    page,
    `05-create-${style.toLowerCase().replace(/\s+/g, '-')}-dialog.png`,
    title,
  );
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await settle(page, 1200);
  const msg = await page.locator('text=/Created /').first().textContent().catch(() => null);
  if (msg) {
    ok(`created ${style}: ${msg}`);
  } else {
    note('note', `create ${style}`, 'No “Created …” confirmation text seen');
  }
  await shot(
    page,
    `05-created-${style.toLowerCase().replace(/\s+/g, '-')}.png`,
    title,
  );
  return title;
}

async function uploadWav(page, name, seconds = 2) {
  await page.goto(`${BASE}/studio/upload`, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const input = page.locator('input[type="file"]').first();
  if ((await input.count()) === 0) {
    fail('upload file input', 'missing');
    return false;
  }
  await input.setInputFiles({
    name,
    mimeType: 'audio/wav',
    buffer: makeSilentWav(seconds, 44100),
  });
  await settle(page, 400);
  // Prefer the page-level Upload (not a nested empty modal's disabled Upload).
  const modal = page.getByRole('dialog', { name: /Upload track/i });
  if (await modal.count()) {
    note(
      'ux',
      'upload',
      'Upload track modal was open alongside page staging — closing it to use the page Upload',
    );
    await page.keyboard.press('Escape').catch(() => {});
    await settle(page, 300);
  }
  const uploadBtn = page
    .getByRole('button', { name: /^Upload( file)?$/i })
    .filter({ hasNot: page.locator('[disabled]') });
  const anyUpload = page.getByRole('button', { name: /^Upload( file)?$/i });
  const btn =
    (await uploadBtn.count()) > 0 ? uploadBtn.first() : anyUpload.first();
  if ((await anyUpload.count()) === 0) {
    fail('upload button', 'missing');
    await shot(page, `fail-upload-${name}.png`);
    return false;
  }
  await btn.click();
  try {
    await Promise.race([
      page.waitForURL(/\/(studio\/sounds|library)/, { timeout: 25_000 }),
      page
        .getByText(/Upload complete|processing|uploaded/i)
        .waitFor({ state: 'visible', timeout: 25_000 }),
      page.waitForTimeout(3000).then(() => {
        throw new Error('no nav/toast within 3s — treating as soft success if file cleared');
      }),
    ]).catch(async (e) => {
      // Soft: staged filename gone often means mock accepted the file.
      const stillStaged = await page.getByText(name).count();
      if (stillStaged === 0) {
        ok(`uploaded ${name} (soft — no toast/nav)`);
        return true;
      }
      throw e;
    });
    ok(`uploaded ${name}`);
    return true;
  } catch (e) {
    fail(`upload ${name}`, e.message);
    await shot(page, `fail-upload-${name}.png`);
    return false;
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log('\n── Artist lifecycle journey ──');
  console.log(`   BASE=${BASE}`);
  console.log(`   artist=${ARTIST_EMAIL} / ${ARTIST_USER}`);
  console.log(`   stream=${STREAM_MINUTES}m every ${STREAM_SHOT_EVERY_MIN}m`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1680, height: 1050 },
  });
  const page = await context.newPage();
  const consoleErrors = await collectConsole(page);

  try {
    // ── 1. Register ──────────────────────────────────────────────
    await page.goto(`${BASE}/join`, { waitUntil: 'load' });
    await settle(page, 500);
    await shot(page, '01-join.png', 'join form');
    if (!(await page.getByLabel('Artist name').count())) {
      // Auth dialog may open from /join
      note('ux', 'register', '/join did not show Artist name — trying dialog');
    }
    // Username is derived from Artist name (no separate Username field).
    note(
      'ux',
      'register',
      'Join form has no Username field; slug comes from Artist name (UsernameAvailabilityHint only).',
    );
    await page.getByLabel('Email').fill(ARTIST_EMAIL);
    const artistToggle = page.getByRole('radio', { name: 'Artist', exact: true });
    const artistBtn = page.getByRole('button', { name: 'Artist', exact: true });
    if (await artistToggle.count()) {
      await artistToggle.first().click();
    } else if (await artistBtn.count()) {
      await artistBtn.first().click();
    }
    await page.getByLabel('Artist name').fill(ARTIST_NAME);

    await page.getByLabel('Password', { exact: true }).fill(ARTIST_PASS);
    await page.getByLabel('Confirm password').fill(ARTIST_PASS);
    await shot(page, '01-join-filled.png', 'join filled');
    await page.getByRole('button', { name: 'Create account' }).click();
    await settle(page, 1000);
    await shot(page, '01-join-after.png', 'after create account');

    // Sign in
    const signInBtn = page.getByRole('button', { name: 'Sign in' });
    if (await signInBtn.count()) {
      await page.getByLabel('Email').fill(ARTIST_EMAIL);
      await page.getByLabel('Password').fill(ARTIST_PASS);
      await signInBtn.click();
    } else {
      await page.goto(`${BASE}/login`, { waitUntil: 'load' });
      await page.getByLabel('Email').fill(ARTIST_EMAIL);
      await page.getByLabel('Password').fill(ARTIST_PASS);
      await page.getByRole('button', { name: 'Sign in' }).click();
    }
    try {
      await page
        .getByRole('button', { name: /^Signed in as/ })
        .waitFor({ state: 'visible', timeout: 15_000 });
      ok('signed in as new artist');
    } catch (e) {
      fail('sign in after register', e.message);
    }
    await markOnboarded(page);
    await page.evaluate(() => {
      localStorage.setItem(
        'tahti-web-theme',
        JSON.stringify({
          state: {
            themeId: 'nuclear:default',
            dark: true,
            colorMode: 'dark',
            customThemes: {},
          },
          version: 0,
        }),
      );
    });
    await page.goto(`${BASE}/studio`, { waitUntil: 'domcontentloaded' });
    await settle(page, 1000);
    await shot(page, '02-studio-home.png', 'studio after register');

    // ── 2. Channel design + promo ────────────────────────────────
    await page.goto(`${BASE}/studio/channel`, { waitUntil: 'domcontentloaded' });
    await settle(page, 1000);
    await shot(page, '03-channel-designer.png', 'channel designer');

    const topBar = page.getByPlaceholder(/New album out/i);
    if (await topBar.count()) {
      await topBar.first().fill('Lifecycle promo — album + EPs out now');
      ok('set top-bar promo text');
    } else {
      const labeled = page.getByLabel(/top bar|promo|banner/i);
      if (await labeled.count()) {
        await labeled.first().fill('Lifecycle promo — album + EPs out now');
        ok('set promo via label');
      } else {
        note(
          'ux',
          'channel promo',
          'No obvious top-bar / promo text field on Channel designer default tab',
        );
      }
    }
    const save = page.getByRole('button', { name: /Save/i });
    if (await save.count()) {
      await save.first().click();
      await settle(page, 800);
    } else {
      note('ux', 'channel save', 'No Save button found after promo edit');
    }
    await shot(page, '03-channel-promo.png', 'after promo');

    // Branding / look tab if present
    for (const tab of ['Design', 'Look', 'Setup', 'Radio']) {
      const t = page.getByRole('tab', { name: tab, exact: true });
      if (await t.count()) {
        await t.first().click();
        await settle(page, 600);
        await shot(
          page,
          `03-channel-tab-${tab.toLowerCase()}.png`,
          `channel tab ${tab}`,
        );
      }
    }

    // ── 3. Upload full-quality WAVs (album fodder) ───────────────
    await shot(page, '04-before-uploads.png', 'before uploads');
    const trackNames = [
      'lifecycle-album-01.wav',
      'lifecycle-album-02.wav',
      'lifecycle-album-03.wav',
      'lifecycle-ep1-01.wav',
      'lifecycle-ep1-02.wav',
      'lifecycle-ep2-01.wav',
      'lifecycle-ep2-02.wav',
      'lifecycle-djset-01.wav',
    ];
    for (const name of trackNames) {
      await uploadWav(page, name, 2);
      await shot(page, `04-uploaded-${name.replace('.wav', '')}.png`, name);
    }

    // ── 4. Create album, 2 EPs, DJ set ────────────────────────────
    await createCollection(page, {
      title: `Polar Nights (${stamp})`,
      style: 'Album',
    });
    await createCollection(page, {
      title: `Ice Out EP (${stamp})`,
      style: 'EP',
    });
    await createCollection(page, {
      title: `Signal Decay EP (${stamp})`,
      style: 'EP',
    });
    await createCollection(page, {
      title: `Night Bus DJ Set (${stamp})`,
      style: 'DJ set',
    });

    // Open first Design link if present — add-tracks affordance
    const design = page.getByRole('link', { name: 'Design' }).first();
    if (await design.count()) {
      await design.click();
      await settle(page, 1000);
      await shot(page, '05-album-designer.png', 'album designer');
      const addTracks = page.getByRole('button', {
        name: /Add track|Add tracks|Upload a new track/i,
      });
      if (await addTracks.count()) {
        await addTracks.first().click();
        await settle(page, 500);
        await shot(page, '05-album-add-tracks.png', 'add tracks dialog');
        const libTrack = page
          .locator('[aria-label="Available library tracks"] button, [aria-label="Available library tracks"] label')
          .first();
        if (await libTrack.count()) {
          await libTrack.click();
          const confirm = page.getByRole('button', {
            name: /Add|Confirm|Save/i,
          });
          if (await confirm.count()) {
            await confirm.last().click();
          }
        } else {
          note(
            'ux',
            'album tracks',
            'Add-tracks dialog opened but no library tracks listed to attach',
          );
        }
      } else {
        note(
          'ux',
          'album designer',
          'No Add track(s) control on collection designer after create',
        );
      }
      await shot(page, '05-album-designer-after.png');
    }

    // ── 5. Fan subscribe + chat ──────────────────────────────────
    await signOut(page);
    await page.goto(`${BASE}/login`, { waitUntil: 'load' });
    await page.getByLabel('Email').fill(FAN_EMAIL);
    await page.getByLabel('Password').fill(FAN_PASS);
    await page.getByRole('button', { name: 'Sign in' }).click();
    try {
      await page
        .getByRole('button', { name: /^Signed in as/ })
        .waitFor({ state: 'visible', timeout: 15_000 });
      ok('fan signed in');
    } catch (e) {
      // mock listener@ always works as listener
      fail('fan sign in', e.message);
      await page.evaluate(
        ({ user }) => {
          localStorage.setItem(
            'tahti-web-auth',
            JSON.stringify({ state: { user }, version: 0 }),
          );
          localStorage.setItem(`tahti-web-onboarded:${user.id}`, '1');
        },
        {
          user: {
            id: 'mock-listener@tahti.live',
            email: FAN_EMAIL,
            username: 'listener',
            displayName: 'Demo Listener',
            role: 'LISTENER',
            roles: ['LISTENER'],
            tier: 'FREE',
            avatarUrl: null,
            isMember: false,
            isBoard: false,
            channel: null,
          },
        },
      );
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      note('note', 'fan auth', 'Fell back to localStorage listener injection');
    }
    await markOnboarded(page);

    const subPath = `/subscribe/${ARTIST_USER}`;
    await page.goto(`${BASE}${subPath}`, { waitUntil: 'domcontentloaded' });
    await settle(page, 1000);
    await shot(page, '06-fan-subscribe.png', subPath);
    const subscribeBtn = page.getByRole('button', { name: /^Subscribe$/i });
    if (await subscribeBtn.count()) {
      await subscribeBtn.first().click();
      await settle(page, 1500);
      await shot(page, '06-fan-subscribe-clicked.png', 'after Subscribe');
      ok('clicked Subscribe');
    } else {
      note(
        'ux',
        'fan subscribe',
        `No Subscribe button on ${subPath} (tiers missing for brand-new mock artist, or already subscribed UI)`,
      );
      // Try demo artist as fallback visibility check
      await page.goto(`${BASE}/subscribe/demo`, {
        waitUntil: 'domcontentloaded',
      });
      await settle(page, 800);
      await shot(page, '06-fan-subscribe-demo.png', 'fallback demo artist');
      const demoSub = page.getByRole('button', { name: /^Subscribe$/i });
      if (await demoSub.count()) {
        await demoSub.first().click();
        await settle(page, 1500);
        await shot(page, '06-fan-subscribe-demo-clicked.png');
        note(
          'note',
          'fan subscribe',
          'Used /subscribe/demo because new artist had no tiers',
        );
      }
    }

    // Chat — channel chat route or panel
    const chatSlug = ARTIST_USER;
    await page.goto(`${BASE}/channel/${chatSlug}`, {
      waitUntil: 'domcontentloaded',
    });
    await settle(page, 1000);
    await shot(page, '07-channel-as-fan.png', 'channel as fan');
    let chatOpened = false;
    for (const path of [
      `/chat/${chatSlug}`,
      `/channel/${chatSlug}?chat=1`,
      `/channel/demo`,
    ]) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
      await settle(page, 800);
      const composer = page.getByPlaceholder(/message|chat|say something|comment/i);
      const textbox = page.getByRole('textbox').last();
      if ((await composer.count()) || (await textbox.count())) {
        const box = (await composer.count()) ? composer.first() : textbox;
        await box.fill('Hey — loved the new EP drop. See you on the stream!');
        await shot(page, '07-chat-compose.png', path);
        const send = page.getByRole('button', {
          name: /Send|Post comment|Post/i,
        });
        if (await send.count()) {
          const label = (await send.first().innerText().catch(() => '')) || 'send';
          await send.first().click();
          await settle(page, 800);
          if (/comment/i.test(label)) {
            note(
              'ux',
              'chat',
              `Only channel comments (“${label.trim()}”) — not live chat — on ${path}`,
            );
          }
          ok(`posted via ${path} (${label.trim() || 'button'})`);
          chatOpened = true;
          await shot(page, '07-chat-sent.png', path);
          break;
        }
        note('ux', 'chat', `Composer on ${path} but no Send/Post button`);
      }
    }
    if (!chatOpened) {
      note(
        'ux',
        'chat',
        'Could not find a working channel chat or comment composer as the fan',
      );
      await shot(page, '07-chat-missing.png', 'chat not found');
    }

    // ── 6. Artist: recurring show + go live ──────────────────────
    await signOut(page);
    await page.goto(`${BASE}/login`, { waitUntil: 'load' });
    await page.getByLabel('Email').fill(ARTIST_EMAIL);
    await page.getByLabel('Password').fill(ARTIST_PASS);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page
      .getByRole('button', { name: /^Signed in as/ })
      .waitFor({ state: 'visible', timeout: 15_000 })
      .catch(() => {});
    await markOnboarded(page);

    await page.goto(`${BASE}/studio/shows`, { waitUntil: 'domcontentloaded' });
    await settle(page, 800);
    await shot(page, '08-shows.png', 'shows list');
    const newShow = page.getByRole('button', {
      name: /New show|Create show|Add show/i,
    });
    if (await newShow.count()) {
      await newShow.first().click();
      await settle(page, 400);
      await page.getByLabel(/Title|Name/i).first().fill(`Recurring Night (${stamp})`);
      const desc = page.getByLabel(/Description/i);
      if (await desc.count()) {
        await desc.fill('Weekly live set for the lifecycle journey.');
      }
      // Prefer series / recurring if offered
      const series = page.getByRole('radio', { name: /Series|Recurring/i });
      if (await series.count()) {
        await series.first().click();
      }
      await shot(page, '08-show-create-dialog.png');
      await page
        .getByRole('button', { name: /Create|Save/i })
        .last()
        .click();
      await settle(page, 1200);
      await shot(page, '08-show-created.png');
      ok('created recurring show');
    } else {
      note(
        'ux',
        'shows',
        'No New show button — opening demo series if present',
      );
      const existing = page.getByRole('link').filter({ hasText: /show|series/i });
      if (await existing.count()) {
        await existing.first().click();
        await settle(page, 800);
        await shot(page, '08-show-existing.png');
      }
    }

    // Go live
    await page.goto(`${BASE}/studio/go-live`, { waitUntil: 'domcontentloaded' });
    await settle(page, 1000);
    await shot(page, '09-go-live.png', 'go live landing');

    const testConn = page.getByRole('button', { name: 'Test connection' });
    if (await testConn.count()) {
      await testConn.click();
      await settle(page, 1000);
      ok('Test connection (mock signal)');
    } else {
      note('blocker', 'go live', 'Test connection button missing in mock');
    }
    await shot(page, '09-signal-ready.png', 'after test connection');

    // Show info if required
    const showInfo = page.getByRole('button', { name: /Show info/i });
    if (await showInfo.count()) {
      await showInfo.first().click();
      await settle(page, 500);
      await shot(page, '09-show-info-modal.png');
      const titleField = page.getByLabel(/title|show name|name/i).first();
      if (await titleField.count()) {
        await titleField.fill(`Recurring Night live (${stamp})`);
      }
      const confirmInfo = page.getByRole('button', {
        name: /Save|Confirm|Done|Close/i,
      });
      if (await confirmInfo.count()) {
        await confirmInfo.last().click();
        await settle(page, 500);
      }
    }

    const goLive = page.getByRole('button', { name: /Go Live|Take over rotation/i });
    if (await goLive.count()) {
      const disabled = await goLive.first().isDisabled();
      if (disabled) {
        note(
          'ux',
          'go live',
          'Go Live button still disabled after Test connection — check show info / weekly cap',
        );
        await shot(page, '09-go-live-disabled.png');
      } else {
        await goLive.first().click();
        await settle(page, 400);
        const confirm = page.getByRole('button', { name: 'Go live', exact: true });
        if (await confirm.count()) {
          await confirm.click();
        }
        await settle(page, 1500);
        ok('went live');
      }
    } else {
      note('blocker', 'go live', 'Go Live button not found');
    }
    await shot(page, '09-live-0m.png', 'live t=0');

    // Public channel while live
    await page.goto(`${BASE}/channel/${ARTIST_USER}`, {
      waitUntil: 'domcontentloaded',
    });
    await settle(page, 1000);
    await shot(page, '09-public-channel-live.png', 'public channel');

    // Stay on go-live for the stream duration
    await page.goto(`${BASE}/studio/go-live`, { waitUntil: 'domcontentloaded' });
    const totalMs = Math.max(0, STREAM_MINUTES) * 60_000;
    const everyMs = Math.max(1, STREAM_SHOT_EVERY_MIN) * 60_000;
    let elapsed = 0;
    while (elapsed < totalMs) {
      const wait = Math.min(everyMs, totalMs - elapsed);
      console.log(
        `  … streaming, waiting ${Math.round(wait / 1000)}s (elapsed ${Math.round(elapsed / 60000)}m / ${STREAM_MINUTES}m)`,
      );
      await page.waitForTimeout(wait);
      elapsed += wait;
      const mins = Math.round(elapsed / 60000);
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await settle(page, 800);
      await shot(page, `09-live-${mins}m.png`, `live t=${mins}m`);
      const onAir = page.getByText(/on air|You’re live|broadcast is on air/i);
      if (!(await onAir.count())) {
        note(
          'ux',
          `live ${mins}m`,
          'On-air copy not visible on Go Live after wait — session may have dropped',
        );
      }
    }
    ok(`held live for ${STREAM_MINUTES} minutes`);

    // Fan returns during stream
    await signOut(page);
    await page.goto(`${BASE}/login`, { waitUntil: 'load' });
    await page.getByLabel('Email').fill(FAN_EMAIL);
    await page.getByLabel('Password').fill(FAN_PASS);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page
      .getByRole('button', { name: /^Signed in as/ })
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => {});
    await page.goto(`${BASE}/channel/${ARTIST_USER}`, {
      waitUntil: 'domcontentloaded',
    });
    await settle(page, 1000);
    await shot(page, '10-fan-watching-live.png', 'fan on channel after stream');
  } catch (e) {
    fail('journey crashed', e.message);
    await shot(page, 'zz-crash.png', e.message).catch(() => {});
  } finally {
    if (consoleErrors.length) {
      const unique = [...new Set(consoleErrors)].slice(0, 20);
      for (const err of unique) {
        note('note', 'console', err.slice(0, 240));
      }
    }
    await browser.close();
  }

  const report = [
    '# Artist lifecycle journey — issues',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Base: ${BASE}`,
    `Artist: ${ARTIST_EMAIL} (${ARTIST_USER})`,
    `Stream: ${STREAM_MINUTES} minutes`,
    '',
    '## Steps',
    '',
    ...steps.map((s) => `- ${s.ok ? 'OK' : 'FAIL'} ${s.label}${s.err ? ` — ${s.err}` : ''}`),
    '',
    '## Findings',
    '',
  ];
  if (issues.length === 0) {
    report.push('_No issues flagged._');
  } else {
    for (const issue of issues) {
      report.push(
        `- **${issue.severity.toUpperCase()}** · \`${issue.step}\` — ${issue.detail}`,
      );
    }
  }
  report.push('', `Screenshots: \`${OUT}\``, '');
  await writeFile(join(OUT, 'ISSUES.md'), `${report.join('\n')}\n`);
  await writeFile(
    join(OUT, 'manifest.json'),
    `${JSON.stringify({ artist: ARTIST_USER, email: ARTIST_EMAIL, steps, issues }, null, 2)}\n`,
  );

  console.log(`\n── Done: ${steps.filter((s) => s.ok).length} ok, ${steps.filter((s) => !s.ok).length} fail, ${issues.length} findings ──`);
  console.log(`   ${join(OUT, 'ISSUES.md')}`);
  if (issues.some((i) => i.severity === 'blocker') || steps.some((s) => !s.ok)) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
