import type { FetchMeta } from '../client';
import { getJson, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';

export type AccountRestrictionType = 'LIVE_SHOW_BOOKING' | 'UPLOAD' | 'LOGIN';

export type AccountRestriction = {
  id: string;
  type: AccountRestrictionType;
  reason: string;
  bannedAt: string;
  expiresAt: string | null;
  liftedAt: string | null;
  bannedByUsername: string | null;
};

export type AccountRestrictionInput = {
  type: AccountRestrictionType;
  reason: string;
  durationDays: number | null;
};

const mockRestrictions = new Map<string, AccountRestriction[]>();

function mockList(userId: string): AccountRestriction[] {
  let list = mockRestrictions.get(userId);
  if (!list) {
    list = [];
    mockRestrictions.set(userId, list);
  }
  return list;
}

function restrictionsPath(userId: string): string {
  return `/api/admin/users/${encodeURIComponent(userId)}/restrictions`;
}

export function isRestrictionActive(
  restriction: AccountRestriction,
  now = Date.now(),
): boolean {
  if (restriction.liftedAt) {
    return false;
  }
  return (
    !restriction.expiresAt || new Date(restriction.expiresAt).getTime() > now
  );
}

export async function fetchAccountRestrictions(
  userId: string,
): Promise<{ data: AccountRestriction[] | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: mockList(userId).map((entry) => ({ ...entry })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<{ restrictions: AccountRestriction[] }>(
      restrictionsPath(userId),
    );
    return { data: data.restrictions ?? [], meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function createAccountRestriction(
  userId: string,
  input: AccountRestrictionInput,
): Promise<
  { ok: true; data: AccountRestriction } | { ok: false; error: string }
> {
  const reason = input.reason.trim();
  if (!reason) {
    return { ok: false, error: 'A reason is required' };
  }
  const durationDays = input.durationDays ?? null;
  if (
    durationDays !== null &&
    (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650)
  ) {
    return { ok: false, error: 'Duration must be 1 to 3650 days' };
  }
  if (isForceMock()) {
    const now = Date.now();
    const created: AccountRestriction = {
      id: `mock-restriction-${now}`,
      type: input.type,
      reason,
      bannedAt: new Date(now).toISOString(),
      expiresAt: durationDays
        ? new Date(now + durationDays * 86_400_000).toISOString()
        : null,
      liftedAt: null,
      bannedByUsername: 'mock-board',
    };
    mockList(userId).unshift(created);
    return { ok: true, data: created };
  }
  try {
    const data = await sendJson<AccountRestriction>(
      restrictionsPath(userId),
      'POST',
      { type: input.type, reason, durationDays },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Restriction failed',
    };
  }
}

export async function liftAccountRestriction(
  userId: string,
  restrictionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    const entry = mockList(userId).find((item) => item.id === restrictionId);
    if (!entry) {
      return { ok: false, error: 'Restriction not found' };
    }
    entry.liftedAt ??= new Date().toISOString();
    return { ok: true };
  }
  try {
    await sendJson(
      `${restrictionsPath(userId)}/${encodeURIComponent(restrictionId)}`,
      'DELETE',
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Lifting failed',
    };
  }
}
