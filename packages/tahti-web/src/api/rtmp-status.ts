import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';

export type RtmpTargetLiveStatus = {
  id: string;
  provider: string;
  label: string;
  enabled: boolean;
  status: 'connected' | 'error' | 'offline' | 'disabled';
  lastError?: string;
};

/** Live state of each multistream (RTMP push) destination — owner or board. */
export async function fetchRtmpTargetStatuses(slug: string): Promise<{
  data: RtmpTargetLiveStatus[] | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [
        {
          id: 'mock-rtmp-1',
          provider: 'youtube',
          label: 'YouTube',
          enabled: true,
          status: 'connected',
        },
        {
          id: 'mock-rtmp-2',
          provider: 'twitch',
          label: 'Twitch',
          enabled: true,
          status: 'error',
          lastError: 'Stream key rejected',
        },
      ],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<RtmpTargetLiveStatus[]>(
      `/api/channels/${encodeURIComponent(slug)}/rtmp-status`,
    );
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}
