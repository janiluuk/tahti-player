import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';

export type ReleaseSmartLinkAnalytics = {
  releaseId: string;
  smartLinkSlug: string;
  smartLinkViewCount: number;
  totalClicks: number;
  clicksByPlatform: Record<string, number>;
};

export async function fetchReleaseSmartLinkAnalytics(
  releaseId: string,
): Promise<{ data: ReleaseSmartLinkAnalytics | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: {
        releaseId,
        smartLinkSlug: 'mock-release',
        smartLinkViewCount: 482,
        totalClicks: 96,
        clicksByPlatform: { spotify: 51, bandcamp: 30, soundcloud: 15 },
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<ReleaseSmartLinkAnalytics>(
      `/api/me/releases/${encodeURIComponent(releaseId)}/analytics`,
    );
    return {
      data: { ...data, clicksByPlatform: data.clicksByPlatform ?? {} },
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}
