import type { FetchMeta } from './client';
import { DEMO_MP3 } from './mock';
import {
  applyMockPreflightPatch,
  endMockLiveEpisode,
  startMockLiveEpisode,
} from './mock-broadcast-preflight';
import {
  getMockIngest,
  getMockSignalConnected,
  getMockChannelState as readMockChannelState,
  setMockChannelLive,
  setMockChannelOffline,
  setMockLiveSlug,
  setMockReconnecting,
  mockSimulateSignal as writeMockSimulateSignal,
} from './mock-live-session';
import { mockFixture } from './mock-overrides';
import {
  allowMockFallback,
  apiErrorMeta,
  isForceMock,
  mockFallbackMeta,
} from './mode';
import { requestJson, RequestJsonError } from './request-json';
import type { TahtiPlayable } from './types';

export { setMockLiveSlug, setMockReconnecting };
export type { StreamOverlay } from './broadcast-overlay';
export { fetchStreamOverlay, patchStreamOverlay } from './broadcast-overlay';
export type { RecentBroadcast } from './broadcast-recordings';
export { fetchRecentBroadcasts } from './broadcast-recordings';
export type { RtmpTarget, RtmpTargetScope } from './broadcast-rtmp';
export {
  createRtmpTarget,
  deleteRtmpTarget,
  fetchRtmpTargets,
  patchRtmpTarget,
  testRtmpTarget,
} from './broadcast-rtmp';

export type StreamSettings = {
  rtmp: { server: string; streamKey: string; fallbackServers?: string[] };
  icecast: {
    server: string;
    mount: string;
    password: string;
    hint?: string;
    fallbackServers?: string[];
  };
  hlsUrl: string;
};

/** Encoder link as the API sees it. `reconnecting` is the grace window after
 * a LIVE encoder drops, until `reconnectDeadline`. */
export type IngestStatus = 'connected' | 'reconnecting' | 'disconnected';

export type SignalStatus = {
  connected: boolean;
  codec: string | null;
  bitrateKbps: number | null;
  listeners: number | null;
  ingest?: IngestStatus;
  reconnectDeadline?: string | null;
};

export type BroadcastShowType = 'LIVE_SET' | 'TALK';
export type BroadcastVisibility = 'PUBLIC' | 'FAN_ONLY' | 'PRIVATE';

export const BROADCAST_TITLE_MAX = 140;
export const BROADCAST_TAGLINE_MAX = 200;

/** `session: 'NONE'` means no encoder yet: edits land in a pre-session
 * draft that the broadcast picks up when the encoder connects. */
export type BroadcastPreflight = {
  session: 'NONE' | 'PREVIEW' | 'LIVE';
  title: string | null;
  tagline: string | null;
  showType: BroadcastShowType;
  visibility: BroadcastVisibility;
  autoPublish: boolean;
  episodeNumber: number | null;
  seriesId: string | null;
  artworkUrl: string | null;
  /** `artworkUrl`, else the artist avatar. */
  coverUrl: string | null;
  plannedRadioShow: {
    episodeNumber: number;
    tagline: string | null;
    showType: BroadcastShowType;
  } | null;
  plannedLiveShow: { seriesId: string; episodeNumber: number | null } | null;
};

export type BroadcastPreflightPatch = {
  title?: string;
  tagline?: string | null;
  showType?: BroadcastShowType;
  visibility?: BroadcastVisibility;
  autoPublish?: boolean;
  seriesId?: string | null;
  artworkUrl?: string | null;
};

const EMPTY_MOCK_PREFLIGHT: BroadcastPreflight = {
  session: 'NONE',
  title: null,
  tagline: null,
  showType: 'LIVE_SET',
  visibility: 'PUBLIC',
  autoPublish: true,
  episodeNumber: null,
  seriesId: null,
  artworkUrl: null,
  coverUrl: null,
  plannedRadioShow: null,
  plannedLiveShow: null,
};

const MOCK_PREFLIGHT_STORAGE_KEY = 'tahti-web-mock-preflight';

/** The offline show-info draft survives reloads in sessionStorage, like the
 * mock live session, so a saved show name is still there after navigating. */
function readStoredMockPreflight(): BroadcastPreflight {
  try {
    const raw = sessionStorage.getItem(MOCK_PREFLIGHT_STORAGE_KEY);
    if (raw) {
      return { ...EMPTY_MOCK_PREFLIGHT, ...JSON.parse(raw) };
    }
  } catch {
    // No storage (private mode, tests without a DOM): keep it in memory.
  }
  return { ...EMPTY_MOCK_PREFLIGHT };
}

let mockPreflight: BroadcastPreflight = readStoredMockPreflight();

function storeMockPreflight(next: BroadcastPreflight): void {
  mockPreflight = next;
  try {
    sessionStorage.setItem(MOCK_PREFLIGHT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // No storage: the in-memory copy is enough.
  }
}

/** Clears the offline show-info draft (tests and stories). */
export function resetMockBroadcastPreflight(): void {
  storeMockPreflight({ ...EMPTY_MOCK_PREFLIGHT });
}

function mockSession(): BroadcastPreflight['session'] {
  const state = readMockChannelState();
  if (state === 'LIVE') {
    return 'LIVE';
  }
  return state === 'PREVIEW' ? 'PREVIEW' : 'NONE';
}

export async function fetchBroadcastPreflight(): Promise<{
  data: BroadcastPreflight | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    try {
      const data = await mockFixture('broadcastPreflight', {
        ...mockPreflight,
        session: mockSession(),
      });
      return { data, meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' } };
    } catch (err) {
      return { data: null, meta: apiErrorMeta(err) };
    }
  }
  try {
    const { data } = await requestJson<BroadcastPreflight>(
      '/api/me/channel/preflight',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function patchBroadcastPreflight(
  patch: BroadcastPreflightPatch,
): Promise<{ data: BroadcastPreflight } | { error: string; status?: number }> {
  if (isForceMock()) {
    const result = applyMockPreflightPatch(
      { ...mockPreflight, session: mockSession() },
      patch,
    );
    if ('data' in result) {
      storeMockPreflight(result.data);
    }
    return result;
  }
  try {
    const { data } = await requestJson<BroadcastPreflight>(
      '/api/me/channel/preflight',
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Pre-flight update failed',
      status: err instanceof RequestJsonError ? err.status : undefined,
    };
  }
}

export type ChannelManageStats = {
  audioBitrateKbps: number | null;
  signalConnected: boolean;
  listeners: number;
  /** All-time highest concurrent-listener count observed. */
  listenerPeak: number;
  liveDurationSec: number | null;
  /** Tracks flagged for the 24/7 fallback rotation; 0 means nothing plays while offline. */
  rotationTrackCount: number;
};

export type BroadcastWarningLevel =
  'none' | '45m' | '55m' | 'grace' | 'blocked';

export type BroadcastUsage = {
  tier?: string;
  unlimited: boolean;
  secondsUsed: number;
  /** Null on unlimited tiers. */
  secondsRemaining: number | null;
  /** The free-tier cap; still sent on unlimited tiers, so check `unlimited` first. */
  weeklyCapSeconds: number;
  /** Extra seconds a live set may run past the cap before it is cut. */
  graceSeconds?: number;
  /** Crossed warning thresholds in seconds (e.g. 2700), not display text. */
  warnings?: (number | string)[];
  warningLevel?: BroadcastWarningLevel;
  inGrace?: boolean;
  atCap?: boolean;
  blocked?: boolean;
  showUpgradeCta?: boolean;
};

const MOCK_USAGE: BroadcastUsage = {
  tier: 'FREE',
  unlimited: false,
  secondsUsed: 12 * 60,
  secondsRemaining: 48 * 60,
  weeklyCapSeconds: 60 * 60,
  graceSeconds: 60,
  warnings: [],
  warningLevel: 'none',
  inGrace: false,
  atCap: false,
  blocked: false,
  showUpgradeCta: false,
};

export type LiveChannelState = 'OFFLINE' | 'PREVIEW' | 'LIVE' | string;

const MOCK_RECORDING_STORAGE_KEY = 'tahti-web-auto-record-broadcast';

export function mockSimulateSignal(connected = true) {
  writeMockSimulateSignal(connected);
}

export function getMockChannelState(): LiveChannelState {
  return readMockChannelState();
}

const MOCK_SETTINGS: StreamSettings = {
  rtmp: {
    server: 'rtmp://ingest.mock.tahti.live/live',
    streamKey: 'demo-slug__mock-stream-key-do-not-share',
  },
  icecast: {
    server: 'https://icecast.mock.tahti.live',
    mount: '/demo-slug',
    password: 'mock-icecast-pass',
    hint: 'Audio-only DJ apps (Mixxx, Traktor, butt) — not OBS.',
  },
  hlsUrl: DEMO_MP3,
};

export async function fetchStreamSettings(): Promise<{
  data: StreamSettings | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: MOCK_SETTINGS,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StreamSettings>(
      '/api/me/stream-settings',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: MOCK_SETTINGS, meta: mockFallbackMeta(err) };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}

let mockRotation = 0;

export async function rotateRtmpStreamKey(): Promise<
  { ok: true; streamKey: string } | { ok: false; error: string }
> {
  if (isForceMock()) {
    mockRotation += 1;
    return {
      ok: true,
      streamKey: `demo-slug__mock-rotated-key-${mockRotation}`,
    };
  }
  try {
    const { data } = await requestJson<{ rtmpStreamKey: string }>(
      '/api/me/stream-settings/rtmp/rotate',
      { method: 'POST' },
    );
    return { ok: true, streamKey: data.rtmpStreamKey };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not make a new stream key',
    };
  }
}

export async function rotateIcecastPassword(): Promise<
  { ok: true; password: string } | { ok: false; error: string }
> {
  if (isForceMock()) {
    mockRotation += 1;
    return { ok: true, password: `mock-icecast-pass-${mockRotation}` };
  }
  try {
    const { data } = await requestJson<{ liveSourcePass: string }>(
      '/api/me/stream-settings/icecast/rotate',
      { method: 'POST' },
    );
    return { ok: true, password: data.liveSourcePass };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not make a new password',
    };
  }
}

export async function fetchSignalStatus(): Promise<{
  data: SignalStatus;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: {
        connected: getMockSignalConnected(),
        codec: getMockSignalConnected() ? 'aac' : null,
        bitrateKbps: getMockSignalConnected() ? 160 : null,
        listeners: getMockSignalConnected() ? 1 : null,
        ...getMockIngest(),
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<SignalStatus>(
      '/api/me/stream-settings/status',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return {
      data: {
        connected: false,
        codec: null,
        bitrateKbps: null,
        listeners: null,
        ingest: 'disconnected',
        reconnectDeadline: null,
      },
      meta: apiErrorMeta(err),
    };
  }
}

export async function fetchChannelManageStats(
  slug: string,
): Promise<{ data: ChannelManageStats | null; meta: FetchMeta }> {
  if (isForceMock()) {
    return {
      data: {
        audioBitrateKbps: getMockSignalConnected() ? 160 : 192,
        signalConnected: getMockSignalConnected(),
        listeners: getMockSignalConnected() ? 1 : 0,
        listenerPeak: 37,
        liveDurationSec: readMockChannelState() === 'LIVE' ? 12 * 60 : null,
        rotationTrackCount: 3,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<ChannelManageStats>(
      `/api/channels/${encodeURIComponent(slug)}/manage-stats`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function fetchBroadcastUsage(): Promise<{
  data: BroadcastUsage | null;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: MOCK_USAGE,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<BroadcastUsage>(
      '/api/me/broadcast-usage',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: MOCK_USAGE, meta: mockFallbackMeta(err) };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function fetchAutoRecordEnabled(): Promise<{
  data: boolean;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    const stored = localStorage.getItem(MOCK_RECORDING_STORAGE_KEY);
    return {
      data: stored === null ? true : stored === 'true',
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ autoRecordEnabled: boolean }>(
      '/api/me/channel/recording',
    );
    return { data: data.autoRecordEnabled, meta: { source: 'api' } };
  } catch (err) {
    return { data: true, meta: apiErrorMeta(err) };
  }
}

export async function patchAutoRecordEnabled(
  autoRecordEnabled: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    localStorage.setItem(MOCK_RECORDING_STORAGE_KEY, String(autoRecordEnabled));
    return { ok: true };
  }
  try {
    await requestJson<{ autoRecordEnabled: boolean }>(
      '/api/me/channel/recording',
      {
        method: 'PATCH',
        body: JSON.stringify({ autoRecordEnabled }),
      },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Recording preference failed',
    };
  }
}

export async function postGoLive(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (isForceMock()) {
    setMockChannelLive();
    await startMockLiveEpisode(mockPreflight);
    return { ok: true };
  }
  try {
    await requestJson<{ ok: true }>('/api/me/channel/go-live', {
      method: 'POST',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Go live failed',
    };
  }
}

export async function postEndBroadcast(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (isForceMock()) {
    setMockChannelOffline();
    storeMockPreflight(await endMockLiveEpisode(mockPreflight));
    return { ok: true };
  }
  try {
    await requestJson<{ ok: true }>('/api/me/channel/end-broadcast', {
      method: 'POST',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'End broadcast failed',
    };
  }
}

/** Rotation transport (Manage tab) — skip/previous/pause/resume act on the
 * channel's archive rotation only; a real live broadcast always takes
 * priority regardless of pause state. */
async function postChannelTransport(
  slug: string,
  action: 'skip' | 'previous' | 'pause' | 'resume',
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson<{ ok: true }>(
      `/api/channels/${encodeURIComponent(slug)}/${action}`,
      { method: 'POST' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : `${action} failed`,
    };
  }
}

export const skipChannelRotation = (slug: string) =>
  postChannelTransport(slug, 'skip');
export const previousChannelRotation = (slug: string) =>
  postChannelTransport(slug, 'previous');
export const pauseChannelRotation = (slug: string) =>
  postChannelTransport(slug, 'pause');
export const resumeChannelRotation = (slug: string) =>
  postChannelTransport(slug, 'resume');

export function liveChannelPlayable(
  slug: string,
  displayName: string,
  hlsUrl: string,
): TahtiPlayable {
  const isHls = hlsUrl.includes('.m3u8');
  return {
    id: `live:${slug}`,
    kind: 'live',
    title: `${displayName} (Live)`,
    artist: displayName,
    streamUrl: hlsUrl || DEMO_MP3,
    protocol: isHls ? 'hls' : 'https',
    channelSlug: slug,
    sourceProvider: 'tahti',
  };
}
