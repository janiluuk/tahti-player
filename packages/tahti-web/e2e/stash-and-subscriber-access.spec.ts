import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// Covers the "stash / private link / subscriber-only content" request, using
// the real visibility model (AudienceVisibilitySection, TrackEditDialog's
// "Sharing" tab): PUBLIC, UNLISTED ("Not listed — direct link only"),
// PRIVATE ("only you"), and STASH ("selected tiers" — subscriber-gated).
//
// Two things from the original ask do NOT have real support in this
// codebase today and are deliberately not tested end-to-end:
//
// 1. The Studio → Stash page (StudioStashView.tsx) is NOT the "private
//    locker, share a link when ready" feature its own copy claims to be —
//    it lists items with visibility STASH/PRIVATE (or isPublic===false),
//    but that filter never matches UNLISTED items, even though UNLISTED is
//    the actual "direct link only" visibility level. So an UNLISTED
//    track — the real equivalent of "stash a track and share a private
//    link" — never shows up in the Stash view at all. This test sets
//    visibility via TrackEditDialog's Sharing tab directly (the real,
//    working mechanism) rather than through the Stash page, and that
//    inconsistency is worth a human's attention as a product bug, not
//    something this test works around by asserting fictional behavior.
// 2. "A subscriber can access it via link" cannot be driven end-to-end:
//    subscribing to a fan tier opens real Stripe Checkout
//    (SubscribeView.tsx: "Subscribe opens Stripe Checkout (or redirects)"),
//    which this suite has no test-mode path through. This test verifies
//    the owner-side behavior that's fully real (uploading with STASH
//    visibility + a fan tier, and that content being absent from the
//    public profile listing) and stops there, the same way
//    real-user-journeys.spec.ts documents the two journeys it couldn't
//    cover rather than faking them.
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

test('an unlisted sound is playable and downloadable via direct link by another visitor, and its Insights panel is real', async ({
  page,
  browser,
}) => {
  await signIn(page);
  const id = await uploadSound(page);

  await setSharing(page, 'Not listed — direct link only');
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
  // surface for this item (not a synchronous play/download counter here —
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

test('a sound limited to a subscriber tier is hidden from the public profile listing', async ({
  page,
  browser,
}) => {
  await signIn(page);
  const id = await uploadSound(page);
  const title = await page
    .getByRole('heading', { level: 1 })
    .first()
    .textContent();

  await setSharing(page, 'Stash — selected tiers');
  // Only proceed to select a tier if one exists — creating a fan tier is a
  // separate flow (Studio → Revenue) this test doesn't also need to drive;
  // STASH visibility alone (with no tier selected) already means "no one
  // but you", which is enough to prove listing-exclusion.
  const firstTierCheckbox = page.getByRole('checkbox').first();
  if (await firstTierCheckbox.isVisible().catch(() => false)) {
    await firstTierCheckbox.check();
  }
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

  // Direct link is still reachable by URL, but not usable without a
  // subscription — this suite stops here; see file header for why.
  await visitorPage.goto(`/t/${id}`);

  await visitorContext.close();
});
