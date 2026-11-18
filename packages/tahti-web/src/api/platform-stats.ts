import { getJson } from './http';
import { FORCE_MOCK } from './mode';

export type PlatformStats = {
  activeArtists: number;
  broadcastsThisMonth: number;
  totalHours: number;
  totalStorageBytes: number;
};

export async function fetchPlatformStats(): Promise<PlatformStats | null> {
  if (FORCE_MOCK) {
    return {
      activeArtists: 42,
      broadcastsThisMonth: 118,
      totalHours: 1260,
      totalStorageBytes: 3_400_000_000_000,
    };
  }
  try {
    return await getJson<PlatformStats>('/api/v1/stats');
  } catch {
    return null;
  }
}
