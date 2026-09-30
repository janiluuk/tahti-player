import type { FetchMeta } from './client';
import { getJson } from './http';
import { failMeta, isForceMock } from './mode';

export type ChatDailyListeners = {
  count: number;
  enabled: boolean;
};

export async function fetchChatDailyListeners(slug: string): Promise<{
  data: ChatDailyListeners | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: { count: 27, enabled: true },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const data = await getJson<ChatDailyListeners>(
      `/api/channels/${encodeURIComponent(slug)}/daily-listeners`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: failMeta(err) };
  }
}
