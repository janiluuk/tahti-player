import type { FetchMeta } from '../client';
import { getJson } from '../http';
import { failMeta, isForceMock } from '../mode';

export type DownloadGateItemStats = {
  soundId: string;
  title: string;
  repostToDownload: boolean;
  followToDownload: boolean;
  repostAckCount: number;
  blockedDownloadAttempts: number;
  countedDownloadCount: number;
};

export type DownloadGateDailyPoint = {
  date: string;
  repostAcks: number;
  blockedAttempts: number;
  countedDownloads: number;
};

export type DownloadGateStats = {
  artistFollowerCount: number;
  items: DownloadGateItemStats[];
  totals: {
    repostAcks: number;
    blockedAttempts: number;
    countedDownloads: number;
  };
  daily: DownloadGateDailyPoint[];
};

function mockDownloadGateStats(): DownloadGateStats {
  return {
    artistFollowerCount: 214,
    items: [
      {
        soundId: 'mock-sound-1',
        title: 'Night Drive (Extended Mix)',
        repostToDownload: true,
        followToDownload: true,
        repostAckCount: 41,
        blockedDownloadAttempts: 17,
        countedDownloadCount: 63,
      },
      {
        soundId: 'mock-sound-2',
        title: 'Aurora',
        repostToDownload: false,
        followToDownload: true,
        repostAckCount: 0,
        blockedDownloadAttempts: 5,
        countedDownloadCount: 22,
      },
    ],
    totals: { repostAcks: 41, blockedAttempts: 22, countedDownloads: 85 },
    daily: [],
  };
}

export async function fetchDownloadGateStats(): Promise<{
  data: DownloadGateStats | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockDownloadGateStats(),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<DownloadGateStats>(
      '/api/me/download-gate-stats',
    );
    return {
      data: { ...data, items: Array.isArray(data.items) ? data.items : [] },
      meta: { source: 'api' },
    };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}
