/** Mock-only on-air session. Survives SPA reloads via sessionStorage so
 * Go Live Prep and the public channel stay LIVE after Test connection /
 * Go live (artist-lifecycle e2e P0). */

export type MockLiveChannelState = 'OFFLINE' | 'PREVIEW' | 'LIVE' | string;

const STORAGE_KEY = 'tahti-web-mock-live-session';

type Stored = {
  signal: boolean;
  state: MockLiveChannelState;
  slug: string | null;
  reconnectDeadline?: string | null;
};

let signalConnected = false;
let channelState: MockLiveChannelState = 'OFFLINE';
let liveSlug: string | null = null;
let reconnectDeadline: string | null = null;

function readStored(): Stored | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as Stored;
  } catch {
    return null;
  }
}

function writeStored() {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    const payload: Stored = {
      signal: signalConnected,
      state: channelState,
      slug: liveSlug,
      reconnectDeadline,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Private mode / quota — keep in-memory only.
  }
}

function hydrate() {
  const stored = readStored();
  if (!stored) {
    return;
  }
  signalConnected = Boolean(stored.signal);
  channelState = stored.state || 'OFFLINE';
  liveSlug = stored.slug ?? null;
  reconnectDeadline = stored.reconnectDeadline ?? null;
}

hydrate();

export function mockSimulateSignal(connected = true) {
  signalConnected = connected;
  reconnectDeadline = null;
  if (connected && channelState === 'OFFLINE') {
    channelState = 'PREVIEW';
  }
  if (!connected) {
    channelState = 'OFFLINE';
  }
  writeStored();
}

export function getMockChannelState(): MockLiveChannelState {
  return channelState;
}

export function getMockSignalConnected(): boolean {
  return signalConnected;
}

export function setMockLiveSlug(slug: string | null) {
  liveSlug = slug;
  writeStored();
}

export function setMockChannelLive(slug?: string | null) {
  if (!signalConnected && channelState === 'OFFLINE') {
    signalConnected = true;
    channelState = 'PREVIEW';
  }
  channelState = 'LIVE';
  reconnectDeadline = null;
  if (slug) {
    liveSlug = slug;
  }
  writeStored();
}

export function setMockChannelOffline() {
  channelState = 'OFFLINE';
  signalConnected = false;
  reconnectDeadline = null;
  writeStored();
}

/** Drops the mock encoder while LIVE and gives it until `deadline` to come
 * back, like the API's reconnect grace window. */
export function setMockReconnecting(deadline: string) {
  channelState = 'LIVE';
  signalConnected = false;
  reconnectDeadline = deadline;
  writeStored();
}

export function getMockIngest(): {
  ingest: 'connected' | 'reconnecting' | 'disconnected';
  reconnectDeadline: string | null;
} {
  if (signalConnected) {
    return { ingest: 'connected', reconnectDeadline: null };
  }
  if (channelState === 'LIVE' && reconnectDeadline) {
    return { ingest: 'reconnecting', reconnectDeadline };
  }
  return { ingest: 'disconnected', reconnectDeadline: null };
}

/** True when this public channel slug should render as LIVE in mock. */
export function isMockChannelLive(slug: string): boolean {
  if (channelState !== 'LIVE') {
    return false;
  }
  if (liveSlug) {
    return liveSlug === slug;
  }
  return false;
}
