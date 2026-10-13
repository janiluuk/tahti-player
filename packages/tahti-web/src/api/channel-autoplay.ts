import { isForceMock } from './mode';
import { requestJson } from './request-json';

const MOCK_KEY = 'tahti-web-mock-channel-autoplay';

/** Whether the artist lets their channel page start playing on its own
 * (`GET /api/me/channel/autoplay`, PLAT-086). `null` when it could not be
 * read, so the toggle is not drawn with a guess. */
export async function fetchChannelAutoplay(): Promise<boolean | null> {
  if (isForceMock()) {
    return localStorage.getItem(MOCK_KEY) !== 'false';
  }
  try {
    const { data } = await requestJson<{ autoplayEnabled: boolean }>(
      '/api/me/channel/autoplay',
    );
    return data.autoplayEnabled;
  } catch {
    return null;
  }
}

export async function setChannelAutoplay(
  autoplayEnabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    localStorage.setItem(MOCK_KEY, String(autoplayEnabled));
    return { ok: true };
  }
  try {
    await requestJson('/api/me/channel/autoplay', {
      method: 'PATCH',
      body: JSON.stringify({ autoplayEnabled }),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save autoplay',
    };
  }
}
