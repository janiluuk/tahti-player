import { apiBase, requestJson } from './client';
import type { JamEvent, JamSession, JamTrack } from './types';

export async function createJam(collectionSlug: string): Promise<JamSession> {
  const { data } = await requestJson<JamSession>('/api/v1/jam', {
    method: 'POST',
    body: JSON.stringify({ collectionSlug }),
  });
  return data;
}

export async function joinJam(code: string): Promise<JamSession> {
  const { data } = await requestJson<JamSession>(
    `/api/v1/jam/${encodeURIComponent(code)}/join`,
    { method: 'POST' },
  );
  return data;
}

export async function fetchJam(sessionId: string): Promise<JamSession> {
  const { data } = await requestJson<JamSession>(
    `/api/v1/jam/${encodeURIComponent(sessionId)}`,
  );
  return data;
}

export async function pushJamState(
  sessionId: string,
  state: {
    isPlaying: boolean;
    currentTrack: JamTrack | null;
    positionSec: number;
  },
): Promise<JamSession> {
  const { data } = await requestJson<JamSession>(
    `/api/v1/jam/${encodeURIComponent(sessionId)}/state`,
    { method: 'POST', body: JSON.stringify(state) },
  );
  return data;
}

/** Host-only: lets a guest change the jam's playback, or takes that back.
 * Resolves to the updated session, or null when the API refuses or doesn't
 * support it yet - the caller hides the control in that case. */
export async function setJamParticipantControl(
  sessionId: string,
  userId: string,
  canControl: boolean,
): Promise<JamSession | null> {
  try {
    const { data } = await requestJson<JamSession>(
      `/api/v1/jam/${encodeURIComponent(sessionId)}/participants/${encodeURIComponent(userId)}`,
      { method: 'PATCH', body: JSON.stringify({ canControl }) },
    );
    return data;
  } catch {
    return null;
  }
}

export async function leaveJam(sessionId: string): Promise<void> {
  await requestJson(`/api/v1/jam/${encodeURIComponent(sessionId)}/leave`, {
    method: 'POST',
  });
}

export async function endJam(sessionId: string): Promise<void> {
  await requestJson(`/api/v1/jam/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
}

/** Opens the session's SSE stream. Cookie auth (`withCredentials`) rather
 * than a bearer token — this is the same session-cookie login as the rest
 * of the site, not the personal API tokens the MCP endpoint uses. */
export function subscribeToJamEvents(
  sessionId: string,
  handlers: {
    onEvent: (event: JamEvent) => void;
    /** The browser auto-reconnects a dropped EventSource on its own; this
     * fires on every drop so the UI can show "reconnecting…" meanwhile. */
    onError?: () => void;
    onOpen?: () => void;
  },
): () => void {
  const source = new EventSource(
    `${apiBase()}/api/v1/jam/${encodeURIComponent(sessionId)}/events`,
    { withCredentials: true },
  );
  source.onopen = () => handlers.onOpen?.();
  source.onerror = () => handlers.onError?.();
  source.onmessage = (message) => {
    try {
      handlers.onEvent(JSON.parse(message.data) as JamEvent);
    } catch {
      // Malformed/ping frame — ignore, the next real message will land fine.
    }
  };
  return () => source.close();
}
