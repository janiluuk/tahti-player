/** Mock-only on-air session. Survives SPA reloads via sessionStorage so
 * Go Live Prep and the public channel stay LIVE after Test connection /
 * Go live (artist-lifecycle e2e P0). */

export type MockLiveChannelState = 'OFFLINE' | 'PREVIEW' | 'LIVE' | string;

const STORAGE_KEY = 'tahti-web-mock-live-session';

type Stored = {
  signal: boolean;
  state: MockLiveChannelState;
  slug: string | null;
};

let signalConnected = false;
let channelState: MockLiveChannelState = 'OFFLINE';
let liveSlug: string | null = null;

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
}

hydrate();

export function mockSimulateSignal(connected = true) {
  signalConnected = connected;
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

export function getMockLiveSlug(): string | null {
  return liveSlug;
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
  if (slug) {
    liveSlug = slug;
  }
  writeStored();
}

export function setMockChannelOffline() {
  channelState = 'OFFLINE';
  signalConnected = false;
  writeStored();
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
