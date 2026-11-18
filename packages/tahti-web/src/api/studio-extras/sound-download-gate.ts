import type { FetchMeta } from '../client';
import { getJson } from '../http';
import { failMeta, isForceMock } from '../mode';

export type SoundDownloadGateStats = {
  repostToDownload: boolean;
  followToDownload: boolean;
  artistFollowerCount: number;
  repostAckCount: number;
  blockedDownloadAttempts: number;
  countedDownloadCount: number;
};

export async function fetchSoundDownloadGateStats(soundId: string): Promise<{
  data: SoundDownloadGateStats | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: {
        repostToDownload: true,
        followToDownload: true,
        artistFollowerCount: 214,
        repostAckCount: 41,
        blockedDownloadAttempts: 17,
        countedDownloadCount: 63,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<SoundDownloadGateStats>(
      `/api/me/sound/${encodeURIComponent(soundId)}/download-gate-stats`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}
