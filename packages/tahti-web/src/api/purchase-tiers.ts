/**
 * One-time purchase tiers (mock + live API client).
 */

import type { FetchMeta } from './client';
import {
  mockUserOwnsPurchaseTier,
  recordMockTrackPurchase,
} from './mock-commerce-ledger';
import { getMockSessionUser } from './mock-session';
import {
  getMockUploadedSound,
  patchMockUploadedSound,
} from './mock-uploads';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';

const forceMock = isForceMock;

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

export type PurchaseTierRow = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  priceOptional: boolean;
  active: boolean;
  position: number;
};

type StoredTiers = {
  artistUsername: string;
  tiers: PurchaseTierRow[];
};

const TIERS_KEY = 'tahti-mock-purchase-tiers';

let memoryTiers: StoredTiers[] = [];

function readAllTiers(): StoredTiers[] {
  if (typeof localStorage === 'undefined') {
    return memoryTiers.map((row) => ({
      artistUsername: row.artistUsername,
      tiers: [...row.tiers],
    }));
  }
  try {
    const raw = localStorage.getItem(TIERS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as StoredTiers[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAllTiers(rows: StoredTiers[]): void {
  memoryTiers = rows.map((row) => ({
    artistUsername: row.artistUsername,
    tiers: [...row.tiers],
  }));
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(TIERS_KEY, JSON.stringify(rows));
}

function artistKey(): string {
  return getMockSessionUser()?.username ?? 'demo';
}

export async function fetchMyPurchaseTiers(): Promise<{
  data: PurchaseTierRow[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    const row = readAllTiers().find(
      (entry) => entry.artistUsername === artistKey(),
    );
    return {
      data: row?.tiers ?? [],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<PurchaseTierRow[]>(
      '/api/me/purchase-tiers',
    );
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: [], meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function createPurchaseTier(input: {
  name: string;
  priceCents: number;
  description?: string;
  priceOptional?: boolean;
}): Promise<{ ok: true; data: PurchaseTierRow } | { ok: false; error: string }> {
  if (forceMock()) {
    const username = artistKey();
    const all = readAllTiers();
    const existing = all.find((entry) => entry.artistUsername === username);
    const tier: PurchaseTierRow = {
      id: `purchase-tier-${Date.now()}`,
      name: input.name,
      description: input.description ?? null,
      priceCents: input.priceCents,
      priceOptional: input.priceOptional ?? false,
      active: true,
      position: existing?.tiers.length ?? 0,
    };
    if (existing) {
      existing.tiers = [...existing.tiers, tier];
    } else {
      all.push({ artistUsername: username, tiers: [tier] });
    }
    writeAllTiers(all);
    return { ok: true, data: tier };
  }
  try {
    const { data } = await requestJson<PurchaseTierRow>(
      '/api/me/purchase-tiers',
      {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          priceCents: input.priceCents,
          description: input.description,
          priceOptional: input.priceOptional ?? false,
        }),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not create purchase tier',
    };
  }
}

export async function setSoundPurchaseAccess(
  soundId: string,
  purchaseTierId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    const sound = getMockUploadedSound(soundId);
    if (!sound) {
      return { ok: false, error: 'Sound not found' };
    }
    patchMockUploadedSound(soundId, {
      accessMode: 'PURCHASE',
      purchaseTierId,
      downloadsEnabled: true,
    });
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/archive/${encodeURIComponent(soundId)}/access`, {
      method: 'PATCH',
      body: JSON.stringify({
        accessMode: 'PURCHASE',
        purchaseTierId,
      }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not set purchase access',
    };
  }
}

export async function checkoutPurchaseTier(
  username: string,
  tierId: string,
  opts?: { amountCents?: number; trackTitle?: string },
): Promise<
  | { ok: true; activated: true }
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string }
> {
  if (forceMock()) {
    const user = getMockSessionUser();
    if (!user) {
      return { ok: false, error: 'Log in to buy' };
    }
    const artistTiers = readAllTiers().find(
      (entry) => entry.artistUsername === username,
    );
    const tier = artistTiers?.tiers.find((row) => row.id === tierId);
    if (!tier || !tier.active) {
      return { ok: false, error: 'Tier not found' };
    }
    const amountCents = opts?.amountCents ?? tier.priceCents;
    recordMockTrackPurchase({
      fanUsername: user.username,
      fanDisplayName: user.displayName,
      artistUsername: username,
      title: opts?.trackTitle ?? tier.name,
      amountCents,
      tierId,
    });
    return { ok: true, activated: true };
  }
  try {
    const { data, status } = await requestJson<{
      activated?: boolean;
      checkoutUrl?: string;
      purchaseId?: string;
    }>(
      `/api/v1/u/${encodeURIComponent(username)}/purchase-tiers/${encodeURIComponent(tierId)}/checkout`,
      {
        method: 'POST',
        body: JSON.stringify(
          opts?.amountCents !== undefined
            ? { amountCents: opts.amountCents }
            : {},
        ),
      },
    );
    if (status === 201 || data.activated) {
      return { ok: true, activated: true };
    }
    if (data.checkoutUrl) {
      return { ok: true, checkoutUrl: data.checkoutUrl };
    }
    return { ok: false, error: 'Unexpected checkout response' };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Checkout failed',
    };
  }
}

export function mockOwnsPurchaseTier(tierId: string): boolean {
  const user = getMockSessionUser();
  if (!user) {
    return false;
  }
  return mockUserOwnsPurchaseTier(user.username, tierId);
}

export function findMockPurchaseTier(
  artistUsername: string,
  tierId: string,
): PurchaseTierRow | null {
  return (
    readAllTiers()
      .find((entry) => entry.artistUsername === artistUsername)
      ?.tiers.find((tier) => tier.id === tierId) ?? null
  );
}
