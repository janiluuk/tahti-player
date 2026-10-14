import type { Track } from '@tahti-player/model';

import type { JamPlayback, JamQueue, JamSettings } from '../lib/jam/bridge';

const TOKEN_KEY = 'tahti-jam-token';

/** Thrown when the desktop app no longer accepts this phone's pairing code. */
export class JamUnpairedError extends Error {}

/** Reads the pairing code from the QR link's `#token=…`, keeps it, and takes it out of the address bar. */
export function readPairingToken(
  location: Location = window.location,
): string | null {
  const fromLink = new URLSearchParams(location.hash.slice(1)).get('token');
  try {
    if (fromLink) {
      localStorage.setItem(TOKEN_KEY, fromLink);
      history.replaceState(null, '', location.pathname + location.search);
      return fromLink;
    }
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return fromLink;
  }
}

export type JamClient = ReturnType<typeof createJamClient>;

/** The Tahti Jam HTTP API, same origin as the remote page. */
export function createJamClient(token: string, base = '') {
  async function request<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${base}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 401) {
      throw new JamUnpairedError('Not paired');
    }
    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(detail?.error ?? `${path} failed (${response.status})`);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  return {
    eventsUrl: `${base}/api/events?token=${encodeURIComponent(token)}`,
    queue: () => request<JamQueue>('/api/queue'),
    playback: () => request<JamPlayback>('/api/playback'),
    settings: () => request<JamSettings>('/api/settings'),
    toggle: () => request<null>('/api/playback/toggle', {}),
    next: () => request<null>('/api/playback/next', {}),
    previous: () => request<null>('/api/playback/previous', {}),
    seek: (seconds: number) => request<null>('/api/playback/seek', { seconds }),
    shuffle: (enabled: boolean) =>
      request<null>('/api/playback/shuffle', { enabled }),
    repeat: (mode: JamSettings['repeat']) =>
      request<null>('/api/playback/repeat', { mode }),
    playItem: (id: string) => request<null>('/api/queue/play', { id }),
    remove: (id: string) => request<null>('/api/queue/remove', { ids: [id] }),
    add: (track: Track) => request<null>('/api/queue/add', { tracks: [track] }),
    search: (query: string) =>
      request<{ tracks: Track[] }>('/api/search', { query, limit: 20 }),
  };
}
