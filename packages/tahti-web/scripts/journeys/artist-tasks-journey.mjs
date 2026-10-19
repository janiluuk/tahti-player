#!/usr/bin/env node
/**
 * Artist task journey against a real backend: sign in, upload a track, edit
 * it, put it in a new release, check the channel, go-live setup, stats and
 * events, then delete the test track and release again. Everything it
 * creates is titled "e2e-test …". It never goes live or publishes.
 *
 *   TAHTI_E2E_EMAIL=… TAHTI_E2E_PASSWORD=… \
 *     node scripts/journeys/artist-tasks-journey.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRun, go, makeToneWav, requireEnv, signIn } from './task-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../../docs/e2e-journeys/artist-tasks');
const EMAIL = requireEnv('TAHTI_E2E_EMAIL');
const PASSWORD = requireEnv('TAHTI_E2E_PASSWORD');
const STAMP = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
const TRACK = `e2e-test track ${STAMP}`;
const RENAMED = `e2e-test renamed ${STAMP}`;
const RELEASE = `e2e-test release ${STAMP}`;

async function dismissInterruptions(page, ux) {
  const ack = page.getByRole('button', { name: 'Acknowledge', exact: true });
  if (await ack.isVisible().catch(() => false)) {
    ux?.(
      'a "Review the updated community guidelines" popover covers the top bar right after sign-in',
    );
    await ack.click();
  }
}

const toasts = (page) =>
  page
    .locator('[role=status], [data-sonner-toast], [role=alert]')
    .allTextContents()
    .then((t) => t.join(' | ').trim())
    .catch(() => '');

async function main() {
  const run = await createRun(join(OUT, 'desktop'), {
    viewport: { width: 1440, height: 900 },
  });
  const { page, task } = run;
  let soundPath = '';
  let channelSlug = '';

  await task('Sign in as artist', async ({ page, ux }) => {
    await signIn(page, EMAIL, PASSWORD);
    await page.waitForTimeout(2000);
    await dismissInterruptions(page, ux);
    const landed = new URL(page.url()).pathname;
    if (!landed.startsWith('/studio'))
      ux(`an artist lands on ${landed}, not Studio`);
    channelSlug = await page.evaluate(() => {
      try {
        return (
          JSON.parse(localStorage.getItem('tahti-web-auth')).state.user.channel
            ?.slug ?? ''
        );
      } catch {
        return '';
      }
    });
    if (!channelSlug) throw new Error('account has no channel');
    return `landed on ${landed}; channel ${channelSlug}`;
  });

  await task(
    'Studio dashboard: what should I do next?',
    async ({ page, ux }) => {
      await go(page, '/studio');
      const h = await page.locator('main h1, main h2').allTextContents();
      const ctas = await page
        .locator('main a:visible, main button:visible')
        .count();
      if (ctas > 60)
        ux(
          `studio dashboard shows ${ctas} links/buttons above and below the fold`,
        );
      const upload = await page
        .getByRole('link', { name: /Upload/ })
        .or(page.getByRole('button', { name: /Upload/ }))
        .count();
      if (!upload) ux('no Upload entry point on the studio dashboard');
      return h.join(' · ').slice(0, 200);
    },
  );

  await task('Upload a track', async ({ page, ux, shot }) => {
    await go(page, '/studio/upload');
    const input = page.locator('input[type="file"]').first();
    if (!(await input.count()))
      throw new Error('no file input on /studio/upload');
    await input.setInputFiles({
      name: `${TRACK}.wav`,
      mimeType: 'audio/wav',
      buffer: makeToneWav(8),
    });
    await page.waitForTimeout(800);
    const modal = page.getByRole('dialog', { name: /Upload track/i });
    if (await modal.count())
      ux(
        'choosing a file opens an "Upload track" dialog on top of the page staging area',
      );
    await shot('upload staged');
    const title = page
      .getByLabel(/^Title/)
      .filter({ visible: true })
      .first();
    if (await title.count()) await title.fill(TRACK);
    else ux('no Title field before uploading; the file name becomes the title');
    const t0 = Date.now();
    await page
      .getByRole('button', { name: /^Upload( file)?$/i })
      .filter({ visible: true })
      .first()
      .click();
    const reached = await page
      .waitForURL(/\/studio\/sounds\/[^/]+/, { timeout: 60_000 })
      .then(
        () => true,
        () => false,
      );
    if (!reached) {
      const err = (await page.locator('main').innerText()).match(
        /[^\n]*(error|failed)[^\n]*/i,
      )?.[0];
      ux(
        `Upload page never finished (${err ?? 'no message'}); retried via the Tracks page Upload dialog`,
      );
      await go(page, '/studio/sounds');
      await page
        .getByRole('button', { name: 'Upload', exact: true })
        .filter({ visible: true })
        .first()
        .click();
      const dialog = page.getByRole('dialog');
      await dialog
        .locator('input[type="file"]')
        .setInputFiles({
          name: `${TRACK}.wav`,
          mimeType: 'audio/wav',
          buffer: makeToneWav(8),
        });
      await dialog
        .getByLabel(/^Title/)
        .fill(TRACK)
        .catch(() => {});
      await dialog
        .getByRole('button', { name: /^Upload/ })
        .last()
        .click();
      await page.waitForURL(/\/studio\/sounds\/[^/]+/, { timeout: 90_000 });
    }
    soundPath = new URL(page.url()).pathname.replace(/\/editor$/, '');
    const s = ((Date.now() - t0) / 1000).toFixed(1);
    const status = await page.locator('main').innerText();
    if (/processing|transcod/i.test(status))
      ux(
        'track page shows a processing state; check it says when it will be playable',
      );
    return `${soundPath} after ${s}s`;
  });

  await task('Edit the track title and description', async ({ page, ux }) => {
    if (!soundPath) throw new Error('no uploaded track');
    await go(page, soundPath);
    let title = page
      .getByLabel(/^Title/)
      .filter({ visible: true })
      .first();
    if (!(await title.count())) {
      const edit = page
        .getByRole('link', { name: /Edit/ })
        .or(page.getByRole('button', { name: /^Edit/ }))
        .first();
      if (!(await edit.count()))
        throw new Error('no title field or Edit control on the track page');
      ux('track page is read-only; editing needs a separate Edit step');
      await edit.click();
      await page.waitForTimeout(1500);
      title = page
        .getByLabel(/^Title/)
        .filter({ visible: true })
        .first();
    }
    await title.fill(RENAMED);
    const desc = page
      .getByLabel(/Description/)
      .filter({ visible: true })
      .first();
    if (await desc.count())
      await desc.fill('Automated e2e test upload — safe to delete.');
    const save = page
      .getByRole('button', { name: /^Save/ })
      .filter({ visible: true })
      .first();
    if (!(await save.count()))
      ux('no Save button; check whether edits autosave and say so');
    else await save.click();
    await page.waitForTimeout(2000);
    const t = await toasts(page);
    if (!t) ux('no confirmation after saving track details');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const body = await page.locator('main').innerText();
    const fieldVal = await page
      .getByLabel(/^Title/)
      .filter({ visible: true })
      .first()
      .inputValue()
      .catch(() => '');
    if (!body.includes(RENAMED) && fieldVal !== RENAMED)
      throw new Error('new title not shown after reload');
    return t.slice(0, 120);
  });

  await task('Find the track in my Sounds list', async ({ page, ux }) => {
    await go(page, '/studio/sounds');
    const search = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/Search|Filter/i))
      .filter({ visible: true })
      .first();
    if (await search.count()) {
      await search.fill('e2e-test');
      await page.waitForTimeout(1500);
    } else ux('no search or filter on the Sounds list');
    const row = await page.getByText(RENAMED).count();
    if (!row) throw new Error(`"${RENAMED}" not in /studio/sounds`);
  });

  await task(
    'Create a release and add the track',
    async ({ page, ux, shot }) => {
      await go(page, '/studio/collections');
      const newBtn = page
        .getByRole('button', { name: /New (collection|release)/ })
        .filter({ visible: true })
        .first();
      if (!(await newBtn.count())) throw new Error('no New collection button');
      await newBtn.click();
      await page.waitForTimeout(800);
      await page
        .getByLabel('Title')
        .filter({ visible: true })
        .first()
        .fill(RELEASE);
      const ep = page
        .getByRole('radio', { name: 'EP', exact: true })
        .or(page.getByRole('button', { name: 'EP', exact: true }));
      if (await ep.count()) await ep.first().click();
      await shot('new release form');
      await page.getByRole('button', { name: 'Create', exact: true }).click();
      await page.waitForTimeout(2500);
      let url = new URL(page.url()).pathname;
      if (!/\/studio\/collections\/./.test(url)) {
        ux(
          'creating a release stays on the list; you have to find and open it yourself',
        );
        const open = page
          .getByRole('link', { name: new RegExp(RELEASE) })
          .first();
        if (await open.count()) await open.click();
        else {
          const design = page
            .locator('main li, main [role=row], main article')
            .filter({ hasText: RELEASE })
            .getByRole('link')
            .first();
          if (!(await design.count()))
            throw new Error('new release not in the list');
          await design.click();
        }
        await page.waitForTimeout(2000);
        url = new URL(page.url()).pathname;
      }
      const add = page
        .getByRole('button', { name: /Add tracks?|Add sounds?|Add content to/ })
        .filter({ visible: true })
        .first();
      if (!(await add.count()))
        throw new Error(`no Add tracks control on ${url}`);
      await add.click();
      await page.waitForTimeout(1500);
      const pick = page.getByRole('dialog').getByText(RENAMED).first();
      if (!(await pick.count()))
        throw new Error('uploaded track not offered in the add-tracks picker');
      await pick.click();
      const confirm = page
        .getByRole('dialog')
        .getByRole('button', { name: /^(Add|Done|Save)/ })
        .first();
      if (await confirm.count()) await confirm.click();
      await page.waitForTimeout(2000);
      const listed = await page.locator('main').getByText(RENAMED).count();
      if (!listed)
        throw new Error('track not listed in the release after adding');
      return url;
    },
  );

  await task('Channel designer and public channel', async ({ page, ux }) => {
    await go(page, '/studio/channel');
    const preview = await page
      .getByRole('link', { name: /View (channel|public)|Preview|Open channel/ })
      .count();
    if (!preview)
      ux('no link from the channel designer to the public channel page');
    await go(page, `/channel/${channelSlug}`);
    const text = await page.locator('main').innerText();
    if (text.includes(RENAMED))
      ux(
        'a freshly uploaded, unreleased track is already public on the channel page',
      );
  });

  await task('Go-live setup (no broadcast)', async ({ page, ux }) => {
    await go(page, '/studio/go-live');
    const text = await page.locator('main').innerText();
    const queuePanel = await page
      .getByText('Queue empty')
      .isVisible()
      .catch(() => false);
    if (queuePanel)
      ux(
        'an empty "Queue" side panel stays open across Studio, taking ~25% of the width',
      );
    const tabRows = await page.locator('main nav, main [role=tablist]').count();
    if (tabRows >= 2)
      ux(
        `go-live sits under ${tabRows} rows of tabs (Studio sections + Broadcast sub-tabs)`,
      );
    await page
      .getByRole('link', { name: 'Credentials' })
      .or(page.getByRole('tab', { name: 'Credentials' }))
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(1500);
    const cred = await page.locator('main').innerText();
    if (!/rtmp|stream key|server url|srt/i.test(cred))
      ux('Credentials tab shows no stream server/key for OBS');
  });

  for (const [path, name] of [
    ['/studio/stats', 'Stats'],
    ['/studio/insights', 'Insights'],
    ['/studio/revenue', 'Fans & revenue'],
    ['/studio/schedule', 'Schedule'],
    ['/studio/events/new', 'New event form'],
    ['/studio/distribution', 'Distribution'],
    ['/settings/artist', 'Artist settings'],
  ]) {
    await task(`${name} page`, async ({ page, ux }) => {
      await go(page, path);
      const scope = path.startsWith('/settings')
        ? page.getByRole('dialog').first()
        : page.locator('main');
      const text = (await scope.innerText().catch(() => '')).trim();
      if (text.length < 40) throw new Error('page is empty');
      if (
        /couldn.t load|failed to load|something went wrong|try again/i.test(
          text,
        )
      )
        ux(
          `${path} shows an error: "${text.match(/[^.\n]*(couldn.t load|failed to load|something went wrong|try again)[^.\n]*/i)?.[0]}"`,
        );
    });
  }

  await task('Cleanup: delete the test release', async ({ page, ux }) => {
    await go(page, '/studio/collections');
    const rowMenu = page.getByRole('button', {
      name: `More options for ${RELEASE}`,
    });
    if (await rowMenu.count()) await rowMenu.click();
    else {
      ux(
        'collections list rows have no delete/more menu; delete is only on the release page',
      );
      const row = page
        .locator('main li, main [role=listitem], main div')
        .filter({ hasText: RELEASE })
        .last();
      if (!(await row.count())) throw new Error('test release row not found');
      await row
        .getByRole('link')
        .or(row.getByRole('button', { name: /Design|Edit/ }))
        .last()
        .click();
      await page.waitForTimeout(2500);
      await page
        .getByRole('button', { name: /^More options for/ })
        .first()
        .click();
    }
    await page
      .getByText(/^Delete (EP|album|release|collection|single)/i)
      .first()
      .click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.waitForTimeout(2500);
    const after = new URL(page.url()).pathname;
    if (!after.startsWith('/studio'))
      ux(`deleting a release from Studio lands on ${after}`);
    await go(page, '/studio/collections');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    if (await page.getByText(RELEASE).count())
      throw new Error('release still listed after delete + reload');
  });

  await task('Cleanup: delete the test track', async ({ page }) => {
    await go(page, '/studio/sounds');
    for (const t of [RENAMED, TRACK]) {
      const more = page.getByRole('button', { name: `More actions for ${t}` });
      if (!(await more.count())) continue;
      await more.first().click();
      await page
        .getByRole('menuitem', { name: 'Delete' })
        .or(page.getByRole('button', { name: 'Delete', exact: true }))
        .first()
        .click();
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Delete', exact: true })
        .click();
      await page.waitForTimeout(2000);
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    if (await page.getByText(/e2e-test (renamed|track)/).count())
      throw new Error('test track still listed');
  });

  await run.finish('Artist tasks — desktop 1440×900');

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
    '/studio',
    '/studio/upload',
    '/studio/sounds',
    '/studio/collections',
    '/studio/go-live',
    '/studio/stats',
    '/studio/channel',
  ]) {
    await phone.task(`Phone: ${path}`, async ({ page }) => go(page, path));
  }
  await phone.finish('Artist tasks — phone 390×844');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
