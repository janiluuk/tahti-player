import { getJson } from './http';
import { isForceMock } from './mode';
import { requestJson } from './request-json';

export type FanChatToken = { token: string; handle: string; channel: string };

/** Connection token for the artist's fan-only room (`POST /api/chat/:slug/fan-token`). */
export async function requestFanChatToken(
  slug: string,
): Promise<{ ok: true; data: FanChatToken } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: false, error: 'The fan room needs the live API.' };
  }
  try {
    const { data } = await requestJson<FanChatToken>(
      `/api/chat/${encodeURIComponent(slug)}/fan-token`,
      { method: 'POST' },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not open the fan room',
    };
  }
}

/** Recent fan-room messages, oldest first (`GET /api/chat/:slug/fan-history`). */
export async function fetchFanChatHistory(
  slug: string,
): Promise<Array<{ handle: string; text: string; ts: number }>> {
  if (isForceMock()) {
    return [];
  }
  try {
    const data = await getJson<{
      messages?: Array<{ handle: string; text: string; ts: number }>;
    }>(`/api/chat/${encodeURIComponent(slug)}/fan-history`);
    return Array.isArray(data.messages) ? data.messages : [];
  } catch {
    return [];
  }
}
