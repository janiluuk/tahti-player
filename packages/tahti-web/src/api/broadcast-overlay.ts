import type { StoredVisualPreset } from './channel-design/presets';
import type { FetchMeta } from './client';
import {
  allowMockFallback,
  apiErrorMeta,
  isForceMock,
  mockFallbackMeta,
} from './mode';
import { requestJson } from './request-json';

export type StreamOverlay = {
  streamOverlayTitle: string | null;
  streamOverlaySubtitle: string | null;
  streamOverlayShowTitle: boolean;
  streamOverlayTextColor: string | null;
  streamOverlayScrimEnabled: boolean;
  streamOverlayCoverUrl: string | null;
  streamOverlayBackdropUrl: string | null;
  streamOverlayVisualPreset: StoredVisualPreset;
};

const EMPTY_STREAM_OVERLAY: StreamOverlay = {
  streamOverlayTitle: null,
  streamOverlaySubtitle: null,
  streamOverlayShowTitle: false,
  streamOverlayTextColor: null,
  streamOverlayScrimEnabled: false,
  streamOverlayCoverUrl: null,
  streamOverlayBackdropUrl: null,
  streamOverlayVisualPreset: 'MINIMAL',
};

let mockStreamOverlay: StreamOverlay = { ...EMPTY_STREAM_OVERLAY };

export async function fetchStreamOverlay(): Promise<{
  data: StreamOverlay;
  meta: FetchMeta;
}> {
  if (isForceMock()) {
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
      return { data: { ...mockStreamOverlay }, meta: mockFallbackMeta(err) };
    }
    return { data: { ...EMPTY_STREAM_OVERLAY }, meta: apiErrorMeta(err) };
  }
}

export async function patchStreamOverlay(
  patch: StreamOverlay,
): Promise<{ ok: true; data: StreamOverlay } | { ok: false; error: string }> {
  if (isForceMock()) {
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
