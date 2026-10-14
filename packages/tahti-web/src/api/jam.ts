import { apiBase, requestJson } from './client';
import {
  mockCreateJam,
  mockFetchJam,
  mockJoinJam,
  mockUpdateJam,
} from './jam.mock';
import { isForceMock } from './mode';
import type { JamEvent, JamSession, JamTrack } from './types';

export async function createJam(collectionSlug: string): Promise<JamSession> {
  if (isForceMock()) {
    return mockCreateJam();
  }
  const { data } = await requestJson<JamSession>('/api/v1/jam', {
    method: 'POST',
    body: JSON.stringify({ collectionSlug }),
  });
  return data;
}

export async function joinJam(code: string): Promise<JamSession> {
  if (isForceMock()) {
    return mockJoinJam(code);
  }
  const { data } = await requestJson<JamSession>(
    `/api/v1/jam/${encodeURIComponent(code)}/join`,
    { method: 'POST' },
  );
  return data;
}

export async function fetchJam(sessionId: string): Promise<JamSession> {
  if (isForceMock()) {
    return mockFetchJam(sessionId);
  }
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
  if (isForceMock()) {
    return mockUpdateJam(sessionId, (session) => ({
      ...session,
      ...state,
      positionUpdatedAt: new Date().toISOString(),
    }));
  }
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
  if (isForceMock()) {
    return mockUpdateJam(sessionId, (session) => ({
      ...session,
      participants: session.participants.map((participant) =>
        participant.userId === userId
          ? { ...participant, canControl }
          : participant,
      ),
    }));
  }
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

/** Host-only: takes a guest out of the jam. They cannot rejoin through the
 * same link. Resolves to `null` when the API refuses or lacks the route. */
export async function removeJamParticipant(
  sessionId: string,
  userId: string,
): Promise<JamSession | null> {
  if (isForceMock()) {
    return mockUpdateJam(sessionId, (session) => ({
      ...session,
      participants: session.participants.filter(
        (participant) => participant.userId !== userId,
      ),
    }));
  }
  try {
    const { data } = await requestJson<JamSession>(
      `/api/v1/jam/${encodeURIComponent(sessionId)}/participants/${encodeURIComponent(userId)}`,
      { method: 'DELETE' },
    );
    return data;
  } catch {
    return null;
  }
}

export async function leaveJam(sessionId: string): Promise<void> {
  if (isForceMock()) {
    return;
  }
  await requestJson(`/api/v1/jam/${encodeURIComponent(sessionId)}/leave`, {
    method: 'POST',
  });
}

export async function endJam(sessionId: string): Promise<void> {
  if (isForceMock()) {
    return;
  }
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
  if (isForceMock()) {
    const timer = setTimeout(() => handlers.onOpen?.(), 0);
    return () => clearTimeout(timer);
  }
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
