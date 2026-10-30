import type { FetchMeta } from './client';
import { getJson, mutate, sendJson } from './http';
import { failMeta, isForceMock } from './mode';

export type ArtworkPreset = {
  id: string;
  url: string;
  enabled: boolean;
  position: number;
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

let mockPresets: ArtworkPreset[] = Array.from({ length: 16 }, (_, index) => ({
  id: `artwork-preset-${String(index + 1).padStart(2, '0')}`,
  url: `/artwork-presets/artwork-${String(index + 1).padStart(2, '0')}.webp`,
  enabled: true,
  position: index,
}));

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

/** Enabled presets, offered in every cover picker. */
export async function fetchArtworkPresets(): Promise<{
  data: ArtworkPreset[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockPresets.filter((preset) => preset.enabled),
      meta: { source: 'mock' },
    };
  }
  try {
    const data = await getJson<{ presets: ArtworkPreset[] }>(
      '/api/v1/artwork-presets',
    );
    return { data: data.presets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function fetchAdminArtworkPresets(): Promise<{
  data: ArtworkPreset[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return { data: [...mockPresets], meta: { source: 'mock' } };
  }
  try {
    const data = await getJson<{ presets: ArtworkPreset[] }>(
      '/api/admin/artwork-presets',
    );
    return { data: data.presets, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function createAdminArtworkPreset(
  url: string,
): Promise<Result<ArtworkPreset>> {
  if (isForceMock()) {
    const preset: ArtworkPreset = {
      id: `artwork-preset-${Date.now()}`,
      url,
      enabled: true,
      position: mockPresets.length,
    };
    mockPresets = [...mockPresets, preset];
    return { ok: true, data: preset };
  }
  try {
    const data = await sendJson<ArtworkPreset>(
      '/api/admin/artwork-presets',
      'POST',
      { url },
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Could not add the artwork') };
  }
}

export async function patchAdminArtworkPreset(
  id: string,
  patch: { enabled?: boolean },
): Promise<Result<ArtworkPreset>> {
  if (isForceMock()) {
    const current = mockPresets.find((preset) => preset.id === id);
    if (!current) {
      return { ok: false, error: 'Preset not found' };
    }
    const updated = { ...current, ...patch };
    mockPresets = mockPresets.map((preset) =>
      preset.id === id ? updated : preset,
    );
    return { ok: true, data: updated };
  }
  try {
    const data = await sendJson<ArtworkPreset>(
      `/api/admin/artwork-presets/${encodeURIComponent(id)}`,
      'PATCH',
      patch,
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Update failed') };
  }
}

export async function deleteAdminArtworkPreset(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    mockPresets = mockPresets.filter((preset) => preset.id !== id);
    return { ok: true };
  }
  return mutate(
    `/api/admin/artwork-presets/${encodeURIComponent(id)}`,
    'DELETE',
  );
}
