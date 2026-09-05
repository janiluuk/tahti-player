import type { MulticastProviderId } from '../plugins/multicast';
import type { FetchMeta } from './client';
import { DEMO_MP3 } from './mock';
import { allowMockFallback, apiErrorMeta, failMeta, isForceMock } from './mode';
import type { TahtiPlayable } from './types';

const forceMock = isForceMock;

const apiBase = () => {
  if (import.meta.env.VITE_TAHTI_API_URL?.startsWith('http')) {
    return import.meta.env.VITE_TAHTI_API_URL.replace(/\/$/, '');
  }
  return '/tahti-api';
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const { headers: initHeaders, ...rest } = init ?? {};
  const res = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...initHeaders,
    },
  });
  if (!res.ok) {
    let detail = `${path} → ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error || body.message) {
        detail = body.error ?? body.message ?? detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return { data: undefined as T, status: res.status };
  }
  return { data: (await res.json()) as T, status: res.status };
}

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

export type SignalStatus = {
  connected: boolean;
  codec: string | null;
  bitrateKbps: number | null;
  listeners: number | null;
};

export type BroadcastPreflight = {
  title: string | null;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FAN_ONLY';
  autoArchive: boolean;
  showType: 'LIVE_SET' | 'TALK';
  episodeNumber: number | null;
  tagline: string | null;
  plannedRadioShow: {
    episodeNumber: number;
    tagline: string | null;
    showType: 'LIVE_SET' | 'TALK';
  } | null;
  plannedLiveShow: { seriesId: string; episodeNumber: number | null } | null;
};

export async function fetchBroadcastPreflight(): Promise<{
  data: BroadcastPreflight | null;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: {
        title: null,
        visibility: 'PUBLIC',
        autoArchive: true,
        showType: 'LIVE_SET',
        episodeNumber: null,
        tagline: null,
        plannedRadioShow: null,
        plannedLiveShow: null,
      },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
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
  patch: Partial<BroadcastPreflight> & { seriesId?: string },
): Promise<{ data: BroadcastPreflight } | { error: string }> {
  try {
    const { data } = await requestJson<BroadcastPreflight>(
      '/api/me/channel/preflight',
      { method: 'PATCH', body: JSON.stringify(patch) },
    );
    return { data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Pre-flight update failed',
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
};

export type BroadcastUsage = {
  unlimited: boolean;
  secondsUsed: number;
  secondsRemaining: number | null;
  weeklyCapSeconds: number;
  warningLevel?: string;
  atCap?: boolean;
  blocked?: boolean;
};

export type RtmpTarget = {
  id: string;
  provider: MulticastProviderId;
  label: string | null;
  rtmpUrl: string;
  alwaysMirror: boolean;
  enabled: boolean;
  keyLast4?: string;
  createdAt?: string;
};

export type LiveChannelState = 'OFFLINE' | 'PREVIEW' | 'LIVE' | string;

// ── Mock session state ──────────────────────────────────────────────────────

let mockSignalConnected = false;
let mockChannelState: LiveChannelState = 'OFFLINE';
const MOCK_RECORDING_STORAGE_KEY = 'tahti-web-auto-record-broadcast';
let mockTargets: RtmpTarget[] = [
  {
    id: 'rtmp-mock-yt',
    provider: 'YOUTUBE',
    label: 'YouTube',
    rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
    alwaysMirror: false,
    enabled: false,
    keyLast4: 'demo',
  },
];

export function mockSimulateSignal(connected = true) {
  mockSignalConnected = connected;
  if (connected && mockChannelState === 'OFFLINE') {
    mockChannelState = 'PREVIEW';
  }
}

export function getMockChannelState(): LiveChannelState {
  return mockChannelState;
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
  if (forceMock()) {
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
      return { data: MOCK_SETTINGS, meta: failMeta(err) };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function fetchSignalStatus(): Promise<{
  data: SignalStatus;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: {
        connected: mockSignalConnected,
        codec: mockSignalConnected ? 'aac' : null,
        bitrateKbps: mockSignalConnected ? 160 : null,
        listeners: mockSignalConnected ? 1 : null,
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
      },
      meta: apiErrorMeta(err),
    };
  }
}

export async function fetchChannelManageStats(
  slug: string,
): Promise<{ data: ChannelManageStats | null; meta: FetchMeta }> {
  if (forceMock()) {
    return {
      data: {
        audioBitrateKbps: mockSignalConnected ? 160 : 192,
        signalConnected: mockSignalConnected,
        listeners: mockSignalConnected ? 1 : 0,
        listenerPeak: 37,
        liveDurationSec: mockChannelState === 'LIVE' ? 12 * 60 : null,
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
  if (forceMock()) {
    return {
      data: {
        unlimited: false,
        secondsUsed: 12 * 60,
        secondsRemaining: 48 * 60,
        weeklyCapSeconds: 60 * 60,
        warningLevel: 'none',
        atCap: false,
        blocked: false,
      },
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
      return {
        data: {
          unlimited: false,
          secondsUsed: 12 * 60,
          secondsRemaining: 48 * 60,
          weeklyCapSeconds: 60 * 60,
          warningLevel: 'none',
          atCap: false,
          blocked: false,
        },
        meta: failMeta(err),
      };
    }
    return { data: null, meta: apiErrorMeta(err) };
  }
}

export async function fetchAutoRecordEnabled(): Promise<{
  data: boolean;
  meta: FetchMeta;
}> {
  if (forceMock()) {
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
  if (forceMock()) {
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
  if (forceMock()) {
    if (!mockSignalConnected && mockChannelState === 'OFFLINE') {
      mockSignalConnected = true;
      mockChannelState = 'PREVIEW';
    }
    mockChannelState = 'LIVE';
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
  if (forceMock()) {
    mockChannelState = 'OFFLINE';
    mockSignalConnected = false;
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
  if (forceMock()) {
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

export async function fetchRtmpTargets(): Promise<{
  data: RtmpTarget[];
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: [...mockTargets],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<RtmpTarget[]>('/api/me/rtmp-targets');
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: [...mockTargets], meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function createRtmpTarget(input: {
  provider: MulticastProviderId;
  streamKey: string;
  label?: string;
  rtmpUrl?: string;
  enabled?: boolean;
}): Promise<{ ok: true; target: RtmpTarget } | { ok: false; error: string }> {
  if (forceMock()) {
    const target: RtmpTarget = {
      id: `rtmp-mock-${Date.now()}`,
      provider: input.provider,
      // Matches tahti-org/apps/api/src/routes/me/rtmp-targets.ts: an unset
      // label is stored as-is, not defaulted to the raw provider id -- the
      // display label fallback (multicastProviderLabel) is what's meant to
      // fill that in, in mock mode and prod alike.
      label: input.label ?? null,
      rtmpUrl: input.rtmpUrl ?? 'rtmp://custom.example/live',
      alwaysMirror: false,
      enabled: input.enabled ?? true,
      keyLast4: input.streamKey.slice(-4),
    };
    mockTargets = [...mockTargets, target];
    return { ok: true, target };
  }
  try {
    const { data } = await requestJson<RtmpTarget>('/api/me/rtmp-targets', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { ok: true, target: data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Create failed',
    };
  }
}

export async function patchRtmpTarget(
  id: string,
  patch: { enabled?: boolean; alwaysMirror?: boolean; label?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    mockTargets = mockTargets.map((t) =>
      t.id === id ? { ...t, ...patch } : t,
    );
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/rtmp-targets/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
}

export async function deleteRtmpTarget(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (forceMock()) {
    mockTargets = mockTargets.filter((t) => t.id !== id);
    return { ok: true };
  }
  try {
    await requestJson(`/api/me/rtmp-targets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Delete failed',
    };
  }
}

export async function testRtmpTarget(
  id: string,
): Promise<
  | { ok: true; reachable: boolean; error?: string }
  | { ok: false; error: string }
> {
  if (forceMock()) {
    return { ok: true, reachable: true };
  }
  try {
    const { data } = await requestJson<{ ok: boolean; error?: string }>(
      `/api/me/rtmp-targets/${encodeURIComponent(id)}/test`,
      { method: 'POST' },
    );
    return { ok: true, reachable: data.ok, error: data.error };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Test failed',
    };
  }
}

export type StreamOverlay = {
  streamOverlayTitle: string | null;
  streamOverlaySubtitle: string | null;
  streamOverlayShowTitle: boolean;
  /** Hex "#RRGGBB", or null to use the default title/subtitle colors. */
  streamOverlayTextColor: string | null;
  streamOverlayCoverUrl: string | null;
};

let mockStreamOverlay: StreamOverlay = {
  streamOverlayTitle: null,
  streamOverlaySubtitle: null,
  streamOverlayShowTitle: false,
  streamOverlayTextColor: null,
  streamOverlayCoverUrl: null,
};

export async function fetchStreamOverlay(): Promise<{
  data: StreamOverlay;
  meta: FetchMeta;
}> {
  if (forceMock()) {
    return {
      data: { ...mockStreamOverlay },
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<StreamOverlay>(
      '/api/me/channel/stream-overlay',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: { ...mockStreamOverlay }, meta: failMeta(err) };
    }
    return {
      data: {
        streamOverlayTitle: null,
        streamOverlaySubtitle: null,
        streamOverlayShowTitle: false,
        streamOverlayTextColor: null,
        streamOverlayCoverUrl: null,
      },
      meta: apiErrorMeta(err),
    };
  }
}

export async function patchStreamOverlay(
  patch: StreamOverlay,
): Promise<{ ok: true; data: StreamOverlay } | { ok: false; error: string }> {
  if (forceMock()) {
    mockStreamOverlay = { ...patch };
    return { ok: true, data: { ...mockStreamOverlay } };
  }
  try {
    const { data } = await requestJson<StreamOverlay>(
      '/api/me/channel/stream-overlay',
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

/** Build a TahtiPlayable for the artist's own live channel after go-live. */
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

export type RecentBroadcast = {
  id: string;
  title?: string | null;
  source?: string;
  startedAt: string;
  endedAt?: string | null;
  soundId: string | null;
  soundTitle?: string;
  soundStatus?: string;
  durationSec?: number;
};

const mockRecordings: RecentBroadcast[] = [
  {
    id: 'rec-1',
    title: 'Friday night set',
    source: 'RTMP',
    startedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    endedAt: new Date(Date.now() - 2 * 86_400_000 + 3600_000).toISOString(),
    soundId: 'arc-1',
    soundTitle: 'Friday night set',
    soundStatus: 'READY',
    durationSec: 3600,
  },
  {
    id: 'rec-2',
    title: null,
    source: 'BROWSER',
    startedAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    endedAt: new Date(Date.now() - 6 * 86_400_000 + 1800_000).toISOString(),
    soundId: null,
    durationSec: 1800,
  },
];

/** Every completed show recording, newest first — recordings made while
 * going live, whether or not they've been promoted into a published
 * archive item yet. */
export async function fetchRecentBroadcasts(
  limit = 50,
): Promise<{ data: RecentBroadcast[]; meta: FetchMeta }> {
  if (forceMock()) {
    return {
      data: mockRecordings,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<{ broadcasts?: RecentBroadcast[] }>(
      `/api/me/broadcasts/recent?limit=${limit}`,
    );
    return { data: data.broadcasts ?? [], meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: mockRecordings, meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export function formatUsageMinutes(usage: BroadcastUsage): string {
  if (usage.unlimited) {
    return 'Unlimited this week';
  }
  const used = Math.floor(usage.secondsUsed / 60);
  const rem =
    usage.secondsRemaining == null
      ? null
      : Math.floor(usage.secondsRemaining / 60);
  const cap = Math.floor(usage.weeklyCapSeconds / 60);
  if (rem == null) {
    return `${used} / ${cap} min used`;
  }
  return `${used} min used, ${rem} min left (cap ${cap})`;
}
