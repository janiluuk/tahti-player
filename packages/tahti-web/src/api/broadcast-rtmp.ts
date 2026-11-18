import type { MulticastProviderId } from '../plugins/multicast';
import type { FetchMeta } from './client';
import {
  allowMockFallback,
  apiErrorMeta,
  isForceMock,
  mockFallbackMeta,
} from './mode';
import { requestJson } from './request-json';

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

export type RtmpTargetScope = 'me' | 'radio';

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

let mockRadioTargets: RtmpTarget[] = [];

function rtmpTargetsPath(scope: RtmpTargetScope, id?: string): string {
  const base =
    scope === 'radio'
      ? '/api/admin/radio/rtmp-targets'
      : '/api/me/rtmp-targets';
  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

function readMockTargets(scope: RtmpTargetScope): RtmpTarget[] {
  return scope === 'radio' ? mockRadioTargets : mockTargets;
}

function writeMockTargets(scope: RtmpTargetScope, next: RtmpTarget[]): void {
  if (scope === 'radio') {
    mockRadioTargets = next;
  } else {
    mockTargets = next;
  }
}

export async function fetchRtmpTargets(scope: RtmpTargetScope = 'me'): Promise<{
  data: RtmpTarget[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: [...readMockTargets(scope)],
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<RtmpTarget[]>(rtmpTargetsPath(scope));
    return { data: Array.isArray(data) ? data : [], meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: [...readMockTargets(scope)], meta: mockFallbackMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

export async function createRtmpTarget(
  input: {
    provider: MulticastProviderId;
    streamKey: string;
    label?: string;
    rtmpUrl?: string;
    enabled?: boolean;
    alwaysMirror?: boolean;
  },
  scope: RtmpTargetScope = 'me',
): Promise<{ ok: true; target: RtmpTarget } | { ok: false; error: string }> {
  if (isForceMock()) {
    if (input.streamKey.trim() === 'fail') {
      return { ok: false, error: 'Ingest rejected the stream key.' };
    }
    const target: RtmpTarget = {
      id: `rtmp-mock-${Date.now()}`,
      provider: input.provider,
      label: input.label ?? null,
      rtmpUrl: input.rtmpUrl ?? 'rtmp://custom.example/live',
      alwaysMirror: input.alwaysMirror ?? false,
      enabled: input.enabled ?? true,
      keyLast4: input.streamKey.slice(-4),
    };
    writeMockTargets(scope, [...readMockTargets(scope), target]);
    return { ok: true, target };
  }
  try {
    const { data } = await requestJson<RtmpTarget>(rtmpTargetsPath(scope), {
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
  scope: RtmpTargetScope = 'me',
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    writeMockTargets(
      scope,
      readMockTargets(scope).map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
    return { ok: true };
  }
  try {
    await requestJson(rtmpTargetsPath(scope, id), {
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
  scope: RtmpTargetScope = 'me',
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    writeMockTargets(
      scope,
      readMockTargets(scope).filter((t) => t.id !== id),
    );
    return { ok: true };
  }
  try {
    await requestJson(rtmpTargetsPath(scope, id), {
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
  scope: RtmpTargetScope = 'me',
): Promise<
  | { ok: true; reachable: boolean; error?: string }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    return { ok: true, reachable: true };
  }
  try {
    const { data } = await requestJson<{ ok: boolean; error?: string }>(
      `${rtmpTargetsPath(scope, id)}/test`,
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
