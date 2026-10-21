#!/usr/bin/env node
/**
 * Listener task journey against a real backend: sign in, find music, play
 * it, queue it, favourite it, follow an artist, use radio, history and
 * search, then repeat the core screens at phone width. Leaves no public
 * trace (favourites are toggled back; no comments are posted).
 *
 *   TAHTI_E2E_LISTENER_EMAIL=… TAHTI_E2E_LISTENER_PASSWORD=… \
 *     node scripts/journeys/listener-tasks-journey.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRun, go, requireEnv, reveal, signIn } from './task-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../../docs/e2e-journeys/listener-tasks');
const EMAIL = requireEnv('TAHTI_E2E_LISTENER_EMAIL');
const PASSWORD = requireEnv('TAHTI_E2E_LISTENER_PASSWORD');

const PLAY = '[aria-label^="Play "][aria-label*="Shift+click"]';

async function dismissInterruptions(page, ux) {
  const ack = page.getByRole('button', { name: 'Acknowledge', exact: true });
  if (await ack.isVisible().catch(() => false)) {
    ux?.(
      'a "Review the updated community guidelines" popover covers the top bar right after sign-in',
    );
    await ack.click();
  }
}

const playerTitle = (page) =>
  page
    .getByRole('button', { name: 'Open full-screen player' })
    .first()
    .textContent()
    .catch(() => '');

const isPlaying = (page) =>
  page
    .locator('footer, [data-testid=player-bar]')
    .getByRole('button', { name: 'Pause', exact: true })
    .count()
    .then((n) => n > 0)
    .catch(() => false);

async function audioState(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('audio, video')].map((a) => ({
      paused: a.paused,
      t: Math.round(a.currentTime * 10) / 10,
      src: (a.currentSrc || '').slice(0, 80),
      err: a.error?.code ?? null,
    })),
  );
}

async function main() {
  const run = await createRun(join(OUT, 'desktop'), {
    viewport: { width: 1440, height: 900 },
  });
  const { task } = run;
  let trackTitle = '';
  let artistHref = '';

  await task('Sign in as listener', async ({ page, ux }) => {
    const t0 = Date.now();
    await signIn(page, EMAIL, PASSWORD);
    const landed = new URL(page.url()).pathname;
    const ms = Date.now() - t0;
    if (ms > 5000) {
      ux(`sign-in took ${(ms / 1000).toFixed(1)}s`);
    }
    if (landed === '/login') {
      ux('still on /login after signing in');
    }
    await page.waitForTimeout(2000);
    await dismissInterruptions(page, ux);
    return `landed on ${landed}`;
  });

  await task('Home: what can I listen to?', async ({ page }) => {
    await go(page, '/');
    await reveal(page, page.locator(PLAY)).catch(() => {});
    const plays = await page.locator(PLAY).count();
    if (plays === 0) {
      throw new Error('no playable tracks on home');
    }
    const headings = await page.locator('main h2').allTextContents();
    return `${plays} playable tracks; sections: ${headings.join(', ')}`;
  });

  await task('Play a track from home', async ({ page, ux }) => {
    const play = page.locator(PLAY).first();
    const label = (await play.getAttribute('aria-label')) ?? '';
    trackTitle = label.replace(/^Play /, '').replace(/ · Shift.*$/, '');
    await play.click({ force: true });
    await page.waitForTimeout(4000);
    const bar = await playerTitle(page);
    const audio = await audioState(page);
    const playing = await isPlaying(page);
    if (!bar.includes(trackTitle)) {
      ux(`player bar shows "${bar.trim().slice(0, 60)}" not "${trackTitle}"`);
    }
    if (!playing) {
      ux('player bar has no Pause button 4s after Play');
    }
    const moving = audio.some((a) => !a.paused && a.t > 0.5);
    if (!moving) {
      throw new Error(`audio not advancing: ${JSON.stringify(audio)}`);
    }
    return `playing "${trackTitle}"`;
  });

  await task('Pause and resume with the space bar', async ({ page, ux }) => {
    await page
      .locator('body')
      .click({ position: { x: 5, y: 450 } })
      .catch(() => {});
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);
    const a1 = await audioState(page);
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);
    const a2 = await audioState(page);
    const pausedOnce = a1.some((a) => a.paused);
    const resumed = a2.some((a) => !a.paused);
    if (!pausedOnce) {
      ux('space bar does not pause playback');
    } else if (!resumed) {
      ux('space bar paused but did not resume');
    }
  });

  await task(
    'Add another track to the queue and open the queue',
    async ({ page, ux }) => {
      const adds = page.getByRole('button', {
        name: 'Add to queue',
        exact: true,
      });
      if ((await adds.count()) < 2) {
        throw new Error('fewer than two "Add to queue" buttons on home');
      }
      await adds.nth(1).click({ force: true });
      await page.waitForTimeout(800);
      const toast = await page
        .locator('[role=status], [data-sonner-toast], [role=alert]')
        .allTextContents();
      if (!toast.join('').trim()) {
        ux('no confirmation after Add to queue');
      }
      const queueBtn = page
        .locator(
          '[data-testid=open-bottom-queue], [data-testid=close-bottom-queue]',
        )
        .first();
      await queueBtn.click();
      await page.waitForTimeout(800);
      return `toast: ${toast.join(' | ').slice(0, 120)}`;
    },
  );

  await task(
    'Favourite the playing track, find it in Favorites, undo',
    async ({ page, ux }) => {
      await go(page, '/');
      await reveal(
        page,
        page.getByRole('button', { name: 'Add to favorites', exact: true }),
      ).catch(() => {});
      const fav = page
        .getByRole('button', { name: 'Add to favorites', exact: true })

        .first();
      if (!(await fav.count())) {
        throw new Error('no "Add to favorites" button on home');
      }
      await fav.click({ force: true });
      await page.waitForTimeout(800);
      await go(page, '/favorites');
      const body = await page.locator('main').innerText();
      if (/no favou?rites/i.test(body) || body.trim().length < 40) {
        ux('favourited track does not show on /favorites');
      }
      const remove = page
        .getByRole('button', { name: /Remove from favou?rites/ })
        .first();
      if (await remove.count()) {
        await remove.click();
      } else {
        ux('no "Remove from favorites" control on /favorites');
      }
    },
  );

  await task('Search for the track I just played', async ({ page, ux }) => {
    const q = trackTitle.split(' ').slice(0, 2).join(' ') || 'a';
    const box = page.getByRole('combobox', { name: /Search artists/ });
    if (!(await box.count())) {
      throw new Error('no global search box');
    }
    await box.click();
    await box.fill(q);
    await page.waitForTimeout(2000);
    const options = await page.getByRole('option').allTextContents();
    if (!options.length) {
      ux(`no suggestions for "${q}"`);
    }
    await box.press('Enter');
    await page.waitForTimeout(2000);
    const url = new URL(page.url());
    if (url.pathname !== '/search') {
      ux(`Enter in search went to ${url.pathname}`);
    }
    const main = await page.locator('main').innerText();
    if (!main.toLowerCase().includes(trackTitle.toLowerCase().slice(0, 8))) {
      ux(`search page for "${q}" does not list "${trackTitle}"`);
    }
    return `${options.length} suggestions; ${url.pathname}${url.search}`;
  });

  await task('Open an artist channel from a track', async ({ page }) => {
    await go(page, '/discover');
    const link = page
      .locator(
        'main a[href^="/channel/"], main a[href^="/u/"], main a[href^="/c/"]',
      )
      .first();
    if (!(await link.count())) {
      throw new Error('no artist link on /discover');
    }
    artistHref = (await link.getAttribute('href')) ?? '';
    await link.click();
    await page.waitForTimeout(2500);
    const h1 = await page
      .locator('h1')
      .first()
      .textContent()
      .catch(() => '');
    return `${artistHref} → "${h1}"`;
  });

  await task('Follow / subscribe to the artist', async ({ page, ux }) => {
    const follow = page
      .getByRole('button', { name: /^(Follow|Subscribe)\b/ })
      .or(page.getByRole('link', { name: /^(Follow|Subscribe)\b/ }))
      .first();
    if (!(await follow.count())) {
      throw new Error('no Follow or Subscribe button on the channel');
    }
    const label = (await follow.textContent())?.trim();
    await follow.click();
    await page.waitForTimeout(2000);
    const dest = new URL(page.url()).pathname;
    const after = await page
      .getByRole('button', {
        name: /^(Following|Unfollow|Subscribed|Unsubscribe)/,
      })
      .count();
    if (dest.startsWith('/subscribe') || dest.includes('/subscribe')) {
      ux(
        `"${label}" opens the paid fan-tier page (${dest}); there is no free follow`,
      );
    } else if (!after) {
      ux(`"${label}" gave no visible followed state`);
    }
    return `clicked "${label}" → ${dest}`;
  });

  await task('Play a radio station', async ({ page }) => {
    await go(page, '/radio');
    const play = page.getByRole('button', { name: /^Play / }).first();
    if (!(await play.count())) {
      throw new Error('no Play button on /radio');
    }
    const label = await play.getAttribute('aria-label');
    await play.click({ force: true });
    await page.waitForTimeout(6000);
    const audio = await audioState(page);
    if (!audio.some((a) => !a.paused && a.t > 1)) {
      throw new Error(`"${label}" did not start: ${JSON.stringify(audio)}`);
    }
    return label;
  });

  await task('Listening history shows what I played', async ({ page, ux }) => {
    await go(page, '/history');
    const text = await page.locator('main').innerText();
    if (trackTitle && !text.includes(trackTitle)) {
      ux(`"${trackTitle}" not in /history after playing it`);
    }
  });

  await task('Library and collections', async ({ page, ux }) => {
    await go(page, '/library');
    const tabs = await page
      .locator('main [role=tab], main nav a')
      .allTextContents();
    await go(page, '/library/collections');
    const create = await page
      .getByRole('button', { name: /New (playlist|collection)|Create/ })
      .count();
    if (!create) {
      ux('no way to create a playlist from /library/collections');
    }
    return `tabs: ${tabs.join(', ')}`;
  });

  await task('Messages and notifications', async ({ page }) => {
    await go(page, '/messages');
  });

  await task('Account settings', async ({ page, ux }) => {
    await go(page, '/settings/account');
    const fields = await page.locator('main input:visible').count();
    if (!fields) {
      ux('account settings has no editable fields');
    }
  });

  await task('Sign out', async ({ page }) => {
    await page.getByRole('button', { name: /^Signed in as/ }).click();
    const out = page
      .getByRole('menuitem', { name: /Sign out|Log out/ })
      .or(page.getByRole('button', { name: /Sign out|Log out/ }));
    if (!(await out.count())) {
      throw new Error('no Sign out in the account menu');
    }
    await out.first().click();
    await page.waitForTimeout(1500);
  });

  await run.finish('Listener tasks — desktop 1440×900');

  const phone = await createRun(join(OUT, 'phone'), {
    viewport: { width: 390, height: 844 },
  });
  await new Promise((r) =>
    setTimeout(r, Number(process.env.JOURNEY_LOGIN_GAP_MS ?? 65_000)),
  );
  await phone.task('Phone: sign in', async ({ page }) => {
    await signIn(page, EMAIL, PASSWORD);
    await page.waitForTimeout(2000);
    await dismissInterruptions(page);
  });
  for (const path of [
    '/',
    '/discover',
    '/radio',
    '/library',
    '/favorites',
    '/history',
    artistHref || '/discover',
  ]) {
    await phone.task(`Phone: ${path}`, async ({ page }) => go(page, path));
  }
  await phone.task(
    'Phone: play from home and open full-screen player',
    async ({ page }) => {
      await go(page, '/');
      await dismissInterruptions(page);
      await reveal(page, page.locator(PLAY));
      await page.locator(PLAY).first().click({ force: true });
      await page.waitForTimeout(3000);
      const open = page
        .getByRole('button', { name: 'Open full-screen player' })
        .first();
      if (!(await open.isVisible().catch(() => false))) {
        throw new Error('no visible player bar on phone');
      }
      await open.click();
      await page.waitForTimeout(1000);
    },
  );
  await phone.finish('Listener tasks — phone 390×844');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
