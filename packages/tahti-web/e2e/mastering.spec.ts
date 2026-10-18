import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

import { E2E_EMAIL, E2E_PASSWORD } from './helpers/auth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function signIn(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(E2E_EMAIL);
  await page.getByLabel('Password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    const userId = raw ? JSON.parse(raw)?.state?.user?.id : null;
    if (typeof userId === 'string') {
      localStorage.setItem(`tahti-web-onboarded:${userId}`, '1');
    }
  });
}

/** The mock editor source URL (`DEMO_MP3` in `api/mock.ts`) points at a
 * real third-party host that sends no `Access-Control-Allow-Origin`
 * header, so the browser's `fetch()` this page needs (to actually decode
 * the track's audio) fails with a CORS error — harmless where the app
 * only uses that URL for a plain `<audio>` tag or a best-effort fetch, but
 * fatal here since mastering needs the real decoded samples. Route it to
 * a local fixture with CORS allowed instead of depending on a live
 * third-party host's CORS policy (out of this repo's control) in a test. */
async function stubEditorSourceAudio(
  page: import('@playwright/test').Page,
): Promise<void> {
  await page.route('https://www.soundhelix.com/**', async (route) => {
    await route.fulfill({
      path: path.join(__dirname, 'fixtures', 'mastering-target-quiet.wav'),
      contentType: 'audio/wav',
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  });
}

test('Reference mastering: reached from the audio editor, matches a reference track, and offers a download', async ({
  page,
}) => {
  test.setTimeout(60000);

  await stubEditorSourceAudio(page);
  await signIn(page);
  await page.goto('/studio/archive/arch-mock-1/editor');

  await page.getByRole('link', { name: 'Mastering' }).click();
  await expect(page).toHaveURL(/\/studio\/mastering\/arch-mock-1/);

  await expect(
    page.getByRole('heading', { name: 'Reference mastering' }),
  ).toBeVisible();

  const referenceInput = page.locator('input[type="file"]').first();
  await referenceInput.setInputFiles(
    path.join(__dirname, 'fixtures', 'mastering-reference-loud.wav'),
  );

  await page.getByRole('button', { name: 'Match to reference' }).click();

  // The full in-browser DSP pipeline runs for real here (no network mock
  // can stand in for it) — the fixtures are short (2s) specifically so
  // this settles quickly and deterministically.
  await expect(page.locator('audio[controls]')).toBeVisible({ timeout: 45000 });
  await expect(page.getByRole('link', { name: 'Download WAV' })).toBeVisible();
});

test('Reference mastering is also reachable from the track editor dialog', async ({
  page,
}) => {
  // The dialog's tab bar sits below the fold at the default test viewport.
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page);
  await page.goto('/studio/archive');

  await page.getByRole('button', { name: /edit/i }).first().click();
  await page.getByRole('tab', { name: 'Audio' }).click();

  await page
    .getByRole('link', { name: 'Match to a reference track →' })
    .click();
  await expect(page).toHaveURL(/\/studio\/mastering\//);
});
