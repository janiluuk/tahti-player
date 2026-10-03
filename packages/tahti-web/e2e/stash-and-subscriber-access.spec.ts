import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// Covers the "stash / private link / subscriber-only content" request, using
// the real visibility model (AudienceVisibilitySection, TrackEditDialog's
// "Sharing" tab). A Sound only stores `isPublic`, so the Audience select
// offers Public and Private ("only you and share links"); subscriber gating
// is the separate "Access" select (accessMode SUBSCRIBERS_ONLY / PURCHASE).
//
// "A subscriber can access it via link" cannot be driven end-to-end:
// subscribing to a fan tier opens real Stripe Checkout
// (SubscribeView.tsx: "Subscribe opens Stripe Checkout (or redirects)"),
// which this suite has no test-mode path through. This test verifies the
// owner-side behavior that's fully real (uploading, making the track
// private, and that content being absent from the public profile listing)
// and stops there, the same way real-user-journeys.spec.ts documents the
// journeys it couldn't cover rather than faking them.
//
// "Marked in event logs": there is no per-play/per-download admin log —
// AdminActivityView.tsx says so directly ("plays) so individual listens
// aren't shown here — see Stats for aggregate play counts"). The only real
// "statistics" surface for an individual track is its Insights panel
// (Studio → Tracks → per-track stats button), which this test opens and
// asserts renders — not a live-incremented number, since nothing in this
// codebase's existing e2e suite asserts a stat updating synchronously
// within a single test run (aggregation is plausibly async/server-side).

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_AUDIO = path.join(
  __dirname,
  'fixtures',
  'mastering-reference-loud.wav',
);

async function signIn(
  page: import('@playwright/test').Page,
  email = 'artist@tahti.live',
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('demo-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(
    page.getByRole('button', { name: /^Signed in as/ }),
  ).toBeVisible();
}

/** Upload the shared fixture WAV via Studio → Upload and return the new
 * sound's id (from the /studio/sounds/$id redirect the upload form does). */
async function uploadSound(
  page: import('@playwright/test').Page,
): Promise<string> {
  await page.goto('/studio/upload');
  await page.locator('input[type="file"]').setInputFiles(FIXTURE_AUDIO);
  await page.getByRole('button', { name: 'Upload file' }).click();
  await expect(page).toHaveURL(/\/studio\/sounds\/[^/]+$/, {
    timeout: 15_000,
  });
  const match = /\/studio\/sounds\/([^/]+)$/.exec(page.url());
  const id = match?.[1];
  if (!id) {
    throw new Error(`Could not extract sound id from ${page.url()}`);
  }
  return id;
}

async function setSharing(
  page: import('@playwright/test').Page,
  audienceLabel: string,
): Promise<void> {
  await page.getByRole('tab', { name: 'Sharing' }).click();
  // Audience uses @tahti-player/ui's Select — a Headless UI Listbox, not a
  // native <select>: open it via its labelled button, then click the option.
  await page.getByLabel('Audience').click();
  await page.getByRole('option', { name: audienceLabel }).click();
}

test('a public sound is playable and downloadable by another visitor, and its Insights panel is real', async ({
  page,
  browser,
}) => {
  await signIn(page);
  const id = await uploadSound(page);

  await setSharing(page, 'Public');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/saved/i)).toBeVisible();

  // A different, unauthenticated visitor opens the direct link.
  const visitorContext = await browser.newContext();
  const visitorPage = await visitorContext.newPage();
  await visitorPage.goto(`/t/${id}`);

  await expect(
    visitorPage.getByRole('button', { name: /^Play$/ }).first(),
  ).toBeVisible();
  await visitorPage
    .getByRole('button', { name: /^Play$/ })
    .first()
    .click();
  await expect(
    visitorPage.getByRole('button', { name: /^Pause$/ }).first(),
  ).toBeVisible();

  const downloadPromise = visitorPage.waitForEvent('download');
  await visitorPage.getByRole('button', { name: /download/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBeTruthy();

  await visitorContext.close();

  // Owner side: the per-track Insights panel is the real "statistics"
  // surface for this item (not a synchronous play/download counter here -
  // see file header).
  await page.goto('/studio/sounds');
  await page
    .getByRole('button', { name: /^Show stats for/ })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Plays')).toBeVisible();
  await expect(page.getByText('Downloads')).toBeVisible();
});

test('a private sound is hidden from the public profile listing', async ({
  page,
  browser,
}) => {
  await signIn(page);
  const id = await uploadSound(page);
  const title = await page
    .getByRole('heading', { level: 1 })
    .first()
    .textContent();

  await setSharing(page, 'Private - only you and share links');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText(/saved/i)).toBeVisible();

  // Public profile, as a different, unauthenticated visitor.
  await page.goto('/studio/branding');
  const profileLinkHref = await page
    .getByRole('link', { name: 'View public profile' })
    .getAttribute('href');
  expect(profileLinkHref).toBeTruthy();

  const visitorContext = await browser.newContext();
  const visitorPage = await visitorContext.newPage();
  await visitorPage.goto(profileLinkHref!);

  if (title) {
    await expect(visitorPage.getByText(title, { exact: true })).toHaveCount(0);
  }

  // Direct link is still reachable by URL, but not usable without a share
  // key - this suite stops here; see file header for why.
  await visitorPage.goto(`/t/${id}`);

  await visitorContext.close();
});
