import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

import { installStripeMock } from './helpers/mockStripe';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_WAV = path.join(
  __dirname,
  'fixtures',
  'mastering-target-quiet.wav',
);

async function markOnboarded(page: Page): Promise<void> {
  await page.evaluate(() => {
    const raw = localStorage.getItem('tahti-web-auth');
    const userId = raw ? JSON.parse(raw)?.state?.user?.id : null;
    if (typeof userId === 'string') {
      localStorage.setItem(`tahti-web-onboarded:${userId}`, '1');
    }
  });
}

async function signIn(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(
    page.getByRole('button', { name: /^Signed in as/ }),
  ).toBeVisible();
  await markOnboarded(page);
}

async function signOut(page: Page): Promise<void> {
  const menu = page.getByRole('button', { name: /^Signed in as/ });
  if (await menu.isVisible().catch(() => false)) {
    await menu.click();
    const logOut = page.getByRole('menuitem', { name: /^Log out$/ });
    if (await logOut.isVisible().catch(() => false)) {
      await logOut.click();
      await expect(
        page.getByRole('button', { name: 'Log in' }).first(),
      ).toBeVisible({ timeout: 10_000 });
      return;
    }
  }
  await page.evaluate(() => localStorage.removeItem('tahti-web-auth'));
  await page.goto('/login');
}

/** Opens the Settings overlay via the sidebar icon — a client-side modal,
 * not a navigation — so in-memory mock session state (mock-session.ts's
 * subscriptions/purchases arrays aren't localStorage-backed) survives,
 * unlike `page.goto('/settings/...')` which forces a real page reload and
 * resets that module back to its hardcoded seed. */
async function openSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Settings' }).click();
}

async function signUpFan(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const username = email.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '') ?? 'fan';
  await page.goto('/join');
  await expect(page.getByLabel('Email')).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Artist name').fill(`Fan ${username}`);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  const signedIn = page.getByRole('button', { name: /^Signed in as/ });
  const signInButton = page.getByRole('button', { name: 'Sign in' });
  if (await signedIn.isVisible().catch(() => false)) {
    await markOnboarded(page);
    return;
  }
  if (await signInButton.isVisible().catch(() => false)) {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await signInButton.click();
  }
  await expect(signedIn).toBeVisible({ timeout: 20_000 });
  await markOnboarded(page);
}

async function uploadPublicPurchasableTrack(
  page: Page,
): Promise<{ soundId: string }> {
  await page.goto('/studio/upload');
  await page.locator('input[type="file"]').setInputFiles(UPLOAD_WAV);
  await page.getByRole('button', { name: 'Upload file' }).click();
  await expect(page).toHaveURL(/\/studio\/sounds\/[^/]+$/, { timeout: 30_000 });
  await expect(page.getByText('Still processing')).toHaveCount(0, {
    timeout: 120_000,
  });

  await page.getByLabel('Audience').click();
  await page.getByRole('option', { name: 'Public' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText(/saved/i)).toBeVisible();

  const soundId = /\/studio\/sounds\/([^/]+)$/.exec(page.url())?.[1];
  if (!soundId) {
    throw new Error(`Could not extract sound id from ${page.url()}`);
  }

  const purchaseSetup = await page.evaluate(async (id) => {
    const mod = await import('/src/api/purchase-tiers.ts');
    const created = await mod.createPurchaseTier({
      name: 'Track download',
      priceCents: 500,
      description: 'One-time unlock for this track',
    });
    if (!created.ok) {
      return { ok: false as const, error: created.error };
    }
    const access = await mod.setSoundPurchaseAccess(id, created.data.id);
    if (!access.ok) {
      return { ok: false as const, error: access.error };
    }
    return { ok: true as const };
  }, soundId);
  expect(purchaseSetup).toMatchObject({ ok: true });

  return { soundId };
}

test('listener buys a track, sees it in Purchases, artist sees the order', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const stripeState = { fanSubs: [], trackOrders: [] };
  await installStripeMock(page, stripeState);

  const artistEmail = process.env.TAHTI_E2E_EMAIL ?? 'artist@tahti.live';
  const artistPassword = process.env.TAHTI_E2E_PASSWORD ?? 'demo-password';
  const fanPassword =
    process.env.TAHTI_E2E_FAN_BUY_PASSWORD ?? 'e2e-buy-password';
  const stamp = Date.now();
  const fanEmail =
    process.env.TAHTI_E2E_FAN_BUY_EMAIL ?? `e2e-lpf-buy-${stamp}@example.com`;

  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('tahti-mock-commerce-ledger');
    localStorage.removeItem('tahti-mock-purchase-tiers');
  });

  await signIn(page, artistEmail, artistPassword);
  const { soundId } = await uploadPublicPurchasableTrack(page);
  const trackUrl = `/t/${soundId}`;

  await signOut(page);
  await signUpFan(page, fanEmail, fanPassword);
  if (page.url().includes('/onboarding')) {
    await markOnboarded(page);
  }

  await page.goto(trackUrl);
  const buyButton = page.getByRole('button', { name: /^Buy this track$/ });
  await expect(buyButton).toBeVisible();
  await buyButton.click();
  await expect(page.getByText('Purchase complete')).toBeVisible({
    timeout: 15_000,
  });
  await expect(buyButton).toHaveCount(0);

  await openSettings(page);
  await page.getByRole('tab', { name: 'Purchases' }).click();
  // Scope to the settings panel, not just getByText: the underlying
  // TrackDetailView page is still mounted behind this overlay (Settings is
  // a modal, not a navigation) and repeats the same title in its own <h1>.
  await expect(
    page
      .getByTestId('settings-panel-content-scroll')
      .getByText('mastering-target-quiet.wav'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  await signOut(page);
  await signIn(page, artistEmail, artistPassword);
  await page.goto('/studio/audience');
  await expect(page.getByRole('heading', { name: 'Audience' })).toBeVisible();
  await expect(
    page
      .getByTestId('fan-order-list')
      .getByText(/Track purchase/i)
      .first(),
  ).toBeVisible();
});

test('listener subscribes, sees it in Your subs, cancels it', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const stripeState = { fanSubs: [], trackOrders: [] };
  await installStripeMock(page, stripeState);

  const artistEmail = process.env.TAHTI_E2E_EMAIL ?? 'artist@tahti.live';
  const artistPassword = process.env.TAHTI_E2E_PASSWORD ?? 'demo-password';
  const fanPassword =
    process.env.TAHTI_E2E_FAN_SUB_PASSWORD ?? 'e2e-sub-password';
  const stamp = Date.now();
  const fanEmail =
    process.env.TAHTI_E2E_FAN_SUB_EMAIL ?? `e2e-lpf-sub-${stamp}@example.com`;

  await signIn(page, artistEmail, artistPassword);
  await page.goto('/studio/branding');
  const profileHref = await page
    .getByRole('link', { name: 'View public profile' })
    .getAttribute('href');
  const username = /\/u\/([^/?#]+)/.exec(profileHref ?? '')?.[1];
  if (!username) {
    throw new Error(`Could not read artist username from ${profileHref}`);
  }

  await signOut(page);
  await signUpFan(page, fanEmail, fanPassword);
  if (page.url().includes('/onboarding')) {
    await markOnboarded(page);
  }

  await page.goto(`/subscribe/${username}`);
  await page.getByRole('button', { name: 'Subscribe' }).first().click();
  await expect(
    page.getByText(/subscribed|Mock subscribed|dev activate/i),
  ).toBeVisible({ timeout: 15_000 });

  await openSettings(page);
  await page.getByRole('tab', { name: 'Your subs' }).click();
  // Target this artist's own row specifically — a seeded demo row for a
  // different artist ("northern-lights", also tierName "Supporter") already
  // ships in mock-session.ts, so matching on tier name alone would pass
  // even if this test's actual subscribe action hadn't worked.
  const subscriptionRow = page
    .locator('li')
    .filter({ has: page.locator(`a[href="/u/${username}"]`) });
  await expect(subscriptionRow).toBeVisible();
  await expect(subscriptionRow.getByText('Supporter')).toBeVisible();

  await subscriptionRow.getByRole('button', { name: 'Manage' }).click();
  await expect(
    page.getByRole('button', { name: 'Cancel subscription' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel subscription' }).click();

  await expect(subscriptionRow.getByText(/cancels/i)).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    subscriptionRow.getByRole('button', { name: 'Manage' }),
  ).toHaveCount(0);
});
