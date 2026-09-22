import type { FetchMeta } from '.././client';
import {
  allowMockFallback,
  apiErrorMeta,
  failMeta,
  isForceMock,
} from '.././mode';
import { requestJson } from '.././request-json';
import { type ChannelVisualPatch } from './visual-api';

/** A named, owner-saved snapshot of the whole Look — see the backend's
 * ChannelVisualPreset model. `settings` is the same object shape the
 * designer builds for `patchChannelVisual`, stored/replayed wholesale. */
export type ChannelVisualPreset = {
  id: string;
  name: string;
  settings: ChannelVisualPatch;
  createdAt: string;
  updatedAt: string;
};

export let mockVisualPresets: ChannelVisualPreset[] = [];

export async function fetchChannelVisualPresets(): Promise<{
  data: ChannelVisualPreset[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [...mockVisualPresets], meta: { source: 'mock' } };
  }
  try {
    const { data } = await requestJson<ChannelVisualPreset[]>(
      '/api/me/channel/visual-presets',
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    if (allowMockFallback()) {
      return { data: [...mockVisualPresets], meta: failMeta(err) };
    }
    return { data: [], meta: apiErrorMeta(err) };
  }
}

/** Saves under `name`, overwriting any existing preset with the same name. */
export async function saveChannelVisualPreset(
  name: string,
  settings: ChannelVisualPatch,
): Promise<
  { ok: true; data: ChannelVisualPreset } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const now = new Date().toISOString();
    const existing = mockVisualPresets.find((p) => p.name === name);
    const preset: ChannelVisualPreset = existing
      ? { ...existing, settings, updatedAt: now }
      : {
          id: `mock-preset-${Date.now()}`,
          name,
          settings,
          createdAt: now,
          updatedAt: now,
        };
    mockVisualPresets = existing
      ? mockVisualPresets.map((p) => (p.id === preset.id ? preset : p))
      : [preset, ...mockVisualPresets];
    return { ok: true, data: preset };
  }
  try {
    const { data } = await requestJson<ChannelVisualPreset>(
      '/api/me/channel/visual-presets',
      { method: 'POST', body: JSON.stringify({ name, settings }) },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Save failed',
    };
  }
}

export async function deleteChannelVisualPreset(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockVisualPresets = mockVisualPresets.filter((p) => p.id !== id);
    return { ok: true };
  }
  try {
    await requestJson<{ ok: true }>(`/api/me/channel/visual-presets/${id}`, {
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
