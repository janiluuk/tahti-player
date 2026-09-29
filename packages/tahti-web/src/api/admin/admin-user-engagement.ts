import type { FetchMeta } from '../client';
import { getJson } from '../http';
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
