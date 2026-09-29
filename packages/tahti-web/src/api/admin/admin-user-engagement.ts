import type { FetchMeta } from '../client';
import { getJson, sendJson } from '../http';
import { failMeta, isForceMock } from '../mode';

export type AdminEngagementAdjustment = {
  units: number;
  reason: string;
  createdAt: string;
  actorId: string;
};

export type AdminUserEngagement = {
  userId: string;
  year: number;
  totalUnits: number;
  adjustments: AdminEngagementAdjustment[];
};

const mockAdjustments = new Map<string, AdminEngagementAdjustment[]>();

export function mockEngagementAdjustments(
  userId: string,
): AdminEngagementAdjustment[] {
  let list = mockAdjustments.get(userId);
  if (!list) {
    list = [];
    mockAdjustments.set(userId, list);
  }
  return list;
}

export async function fetchAdminUserEngagement(
  userId: string,
  year: number,
): Promise<{ data: AdminUserEngagement | null; meta: FetchMeta }> {
  if (isForceMock()) {
    const adjustments = mockEngagementAdjustments(userId).filter(
      (entry) => new Date(entry.createdAt).getUTCFullYear() === year,
    );
    return {
      data: {
        userId,
        year,
        totalUnits:
          (year === new Date().getUTCFullYear() ? 120 : 0) +
          adjustments.reduce((sum, entry) => sum + entry.units, 0),
        adjustments,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<AdminUserEngagement>(
      `/api/admin/users/${encodeURIComponent(userId)}/engagement?year=${year}`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}

export async function createEngagementAdjustment(input: {
  userId: string;
  units: number;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const reason = input.reason.trim();
  if (!Number.isInteger(input.units) || input.units === 0) {
    return { ok: false, error: 'Units must be a whole number other than 0' };
  }
  if (!reason) {
    return { ok: false, error: 'A reason is required' };
  }
  if (isForceMock()) {
    mockEngagementAdjustments(input.userId).unshift({
      units: input.units,
      reason,
      createdAt: new Date().toISOString(),
      actorId: 'mock-board',
    });
    return { ok: true };
  }
  try {
    await sendJson('/api/admin/engagement/adjustment', 'POST', {
      userId: input.userId,
      units: input.units,
      reason,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Adjustment failed',
    };
  }
}
