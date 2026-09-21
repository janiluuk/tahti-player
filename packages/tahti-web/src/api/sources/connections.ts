import { setMockOauthConnected, type MockOauthId } from '.././mock-session';
import { isForceMock } from '.././mode';
import { requestJson } from '.././request-json';

/** Mock-only: flip an OAuth integration to connected without leaving the app. */
export async function connectIntegrationMock(
  id: MockOauthId,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isForceMock()) {
    return { ok: false, error: 'connectIntegrationMock is mock-only' };
  }
  setMockOauthConnected(id, true);
  return { ok: true };
}

export async function disconnectIntegration(
  id: 'bandcamp' | 'soundcloud' | 'google-drive' | 'mixcloud' | 'musicbrainz',
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    setMockOauthConnected(id, false);
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/${id}`, { method: 'DELETE' });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Disconnect failed',
    };
  }
}
