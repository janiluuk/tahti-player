import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

import { grantBoardView, installStripeMock } from './helpers/mockStripe';

const RIFF_CANDIDATES = [
  path.join(os.homedir(), 'Downloads', 'riff.wav'),
  path.join(os.homedir(), 'Music', 'riff.wav'),
  process.env.TAHTI_E2E_RIFF_WAV ?? '',
].filter(Boolean);

type WavIdentity = {
  riff: string;
  wave: string;
  channels: number | null;
  sampleRate: number | null;
  bitsPerSample: number | null;
  byteLength: number;
  sha256: string;
  looksLikeWav: boolean;
};

function resolveRiffWav(): string {
  const found = RIFF_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(
      `riff.wav not found. Looked in: ${RIFF_CANDIDATES.join(', ')}`,
    );
  }
  return found;
}

function wavIdentity(buf: Buffer): WavIdentity {
  const riff = buf.toString('ascii', 0, 4);
  const wave = buf.length >= 12 ? buf.toString('ascii', 8, 12) : '';
  const looksLikeWav = riff === 'RIFF' && wave === 'WAVE';
  return {
    riff,
    wave,
    channels: looksLikeWav && buf.length >= 24 ? buf.readUInt16LE(22) : null,
    sampleRate: looksLikeWav && buf.length >= 28 ? buf.readUInt32LE(24) : null,
    bitsPerSample:
      looksLikeWav && buf.length >= 36 ? buf.readUInt16LE(34) : null,
    byteLength: buf.length,
    sha256: createHash('sha256').update(buf).digest('hex'),
    looksLikeWav,
  };
}

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
      ).toBeVisible({
        timeout: 10_000,
      });
      return;
    }
  }
  await page.evaluate(() => localStorage.removeItem('tahti-web-auth'));
  await page.goto('/login');
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

async function captureDownload(
  page: Page,
  buttonName: RegExp | string,
  soundId: string,
): Promise<Buffer> {
  await page.getByRole('button', { name: buttonName }).click();
  const bytes = await page.evaluate(async (id) => {
    const client = await import('/src/api/client.ts');
    const detail = await client.fetchTrackDetail(id);
    if (!detail.data) {
      throw new Error('Track detail missing');
    }
    const result = await client.fetchPublicArchiveDownload(
      detail.data.channelSlug,
      id,
    );
    if (!result.ok) {
      throw new Error(result.error);
    }
    const response = await fetch(result.url);
    const buffer = await response.arrayBuffer();
    return Array.from(new Uint8Array(buffer));
  }, soundId);
  return Buffer.from(bytes);
}

test('subscriber and track purchase both get the original WAV; artist sees both orders; audit log records them', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const stripeState = { fanSubs: [], trackOrders: [] };
  await installStripeMock(page, stripeState);

  const riffPath = resolveRiffWav();
  const original = wavIdentity(fs.readFileSync(riffPath));
  expect(original.looksLikeWav).toBe(true);

  const artistEmail = process.env.TAHTI_E2E_EMAIL ?? 'artist@tahti.live';
  const artistPassword = process.env.TAHTI_E2E_PASSWORD ?? 'demo-password';
  const fanPassword = process.env.TAHTI_E2E_FAN_PASSWORD ?? 'e2e-fan-password';
  const stamp = Date.now();
  const fanSubEmail =
    process.env.TAHTI_E2E_FAN_SUB_EMAIL ?? `e2e-sub-${stamp}@example.com`;
  const fanBuyEmail =
    process.env.TAHTI_E2E_FAN_BUY_EMAIL ?? `e2e-buy-${stamp}@example.com`;
  const existingFans = Boolean(
    process.env.TAHTI_E2E_FAN_SUB_EMAIL && process.env.TAHTI_E2E_FAN_BUY_EMAIL,
  );

  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('tahti-mock-commerce-ledger');
    localStorage.removeItem('tahti-mock-purchase-tiers');
  });

  await signIn(page, artistEmail, artistPassword);
  await page.goto('/studio/upload');
  await page.locator('input[type="file"]').setInputFiles(riffPath);
  await page.getByRole('button', { name: 'Upload file' }).click();
  await expect(page).toHaveURL(/\/studio\/sounds\/[^/]+$/, { timeout: 30_000 });
  await expect(page.getByText('Still processing')).toHaveCount(0, {
    timeout: 120_000,
  });

  await page.getByLabel('Audience').click();
  await page.getByRole('option', { name: 'Public' }).click();
  const downloads = page.getByLabel('Allow downloads');
  if (!(await downloads.isChecked())) {
    await downloads.check();
  }
  await page.getByRole('button', { name: 'Save changes' }).click();
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
    return { ok: true as const, tierId: created.data.id };
  }, soundId);
  expect(purchaseSetup).toMatchObject({ ok: true });

  await page.goto('/studio/branding');
  const profileHref = await page
    .getByRole('link', { name: 'View public profile' })
    .getAttribute('href');
  const username = /\/u\/([^/?#]+)/.exec(profileHref ?? '')?.[1];
  if (!username) {
    throw new Error(`Could not read artist username from ${profileHref}`);
  }
  const trackUrl = `/t/${soundId}`;

  await signOut(page);
  if (existingFans) {
    await signIn(page, fanSubEmail, fanPassword);
  } else {
    await signUpFan(page, fanSubEmail, fanPassword);
  }
  if (page.url().includes('/onboarding')) {
    await markOnboarded(page);
  }
  await page.goto(`/subscribe/${username}`);
  await page.getByRole('button', { name: 'Subscribe' }).first().click();
  await expect(
    page.getByText(/subscribed|Mock subscribed|dev activate/i),
  ).toBeVisible({
    timeout: 15_000,
  });
  await page.goto(trackUrl);
  const subscriberFile = wavIdentity(
    await captureDownload(page, /^Download$/, soundId),
  );

  await signOut(page);
  if (existingFans) {
    await signIn(page, fanBuyEmail, fanPassword);
  } else {
    await signUpFan(page, fanBuyEmail, fanPassword);
  }
  if (page.url().includes('/onboarding')) {
    await markOnboarded(page);
  }
  await page.goto(trackUrl);
  await expect(
    page.getByRole('button', { name: /buy this track/i }),
  ).toBeVisible();
  const purchaseFile = wavIdentity(
    await captureDownload(page, /buy this track/i, soundId),
  );

  expect(subscriberFile.sha256).toBe(purchaseFile.sha256);
  expect(subscriberFile.looksLikeWav).toBe(true);
  expect(subscriberFile.sampleRate).toBe(original.sampleRate);
  expect(subscriberFile.bitsPerSample).toBe(original.bitsPerSample);
  expect(subscriberFile.channels).toBe(original.channels);
  expect(subscriberFile.sha256).toBe(original.sha256);

  await signOut(page);
  await signIn(page, artistEmail, artistPassword);
  await page.goto('/studio/audience');
  await expect(page.getByRole('heading', { name: 'Audience' })).toBeVisible();
  const orders = page.getByTestId('fan-order-list');
  await expect(orders.getByText(/Fan-sub — Supporter/i).first()).toBeVisible();
  await expect(
    orders.getByText(/Track purchase — riff\.wav/i).first(),
  ).toBeVisible();

  await grantBoardView(page);
  await page.goto('/admin/logs');
  await expect(page.getByRole('heading', { name: 'Logs' })).toBeVisible();
  await page.getByRole('tab', { name: /Audit events/i }).click();
  await expect(page.getByText(/subscribed/i).first()).toBeVisible();
  await expect(page.getByText(/ledger entry|riff\.wav/i).first()).toBeVisible();
});
