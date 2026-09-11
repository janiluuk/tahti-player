import type { FetchMeta } from './client';
import { DEMO_MP3 } from './mock';
import { getMockUploadedSound } from './mock-uploads';
import { isForceMock } from './mode';

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
  return { data: (await res.json()) as T, status: res.status };
}

function failMeta(err: unknown): FetchMeta {
  return {
    source: 'mock',
    reason: err instanceof Error ? err.message : 'fetch failed',
  };
}

/** A rendered/uploaded revision of a sound track. Old versions are kept
 * (not deleted) when a new one is rendered — GC is a server-side concern. */
export type SoundVersion = {
  id: string;
  versionNumber: number;
  versionLabel: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR' | string;
  isActive: boolean;
  durationSec: number | null;
  sourceFormat: string | null;
  sourceBitrateKbps: number | null;
  sourceSampleRateHz: number | null;
  sourceBitDepth: number | null;
  sourceChannels: number | null;
  createdAt: string;
};

const mockVersionsByItem = new Map<string, SoundVersion[]>();
const mockVersionFiles = new Map<string, { url: string; filename: string }>();

function sourceFormatFromName(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'wav' || ext === 'wave') {
    return 'wav';
  }
  if (ext === 'flac') {
    return 'flac';
  }
  if (ext === 'aiff' || ext === 'aif') {
    return 'aiff';
  }
  if (ext === 'ogg') {
    return 'ogg';
  }
  if (ext === 'm4a') {
    return 'm4a';
  }
  return 'mp3';
}

export function addMockSoundVersion(
  soundId: string,
  input: {
    versionLabel: string;
    url?: string;
    filename?: string;
    activate?: boolean;
  },
): SoundVersion {
  const versions = mockVersions(soundId);
  const nextNumber =
    versions.reduce(
      (highest, version) => Math.max(highest, version.versionNumber),
      0,
    ) + 1;
  const id = `ver-mock-${soundId}-${nextNumber}-${Date.now()}`;
  const filename = input.filename ?? 'revision.wav';
  const url = input.url ?? DEMO_MP3;
  const row: SoundVersion = {
    id,
    versionNumber: nextNumber,
    versionLabel: input.versionLabel,
    status: 'READY',
    isActive: false,
    durationSec: 180,
    sourceFormat: sourceFormatFromName(filename),
    sourceBitrateKbps: null,
    sourceSampleRateHz: 44100,
    sourceBitDepth: 16,
    sourceChannels: 2,
    createdAt: new Date().toISOString(),
  };
  const next = versions.map((version) => ({
    ...version,
    isActive: input.activate ? false : version.isActive,
  }));
  if (input.activate) {
    row.isActive = true;
  }
  next.push(row);
  mockVersionsByItem.set(soundId, next);
  mockVersionFiles.set(id, { url, filename });
  return row;
}

function mockVersions(soundId: string): SoundVersion[] {
  const existing = mockVersionsByItem.get(soundId);
  if (existing) {
    return existing;
  }
  const initial: SoundVersion[] = [
    {
      id: `ver-mock-${soundId}-1`,
      versionNumber: 1,
      versionLabel: 'Original upload',
      status: 'READY',
      isActive: true,
      durationSec: 180,
      sourceFormat: 'mp3',
      sourceBitrateKbps: 320,
      sourceSampleRateHz: 44100,
      sourceBitDepth: 16,
      sourceChannels: 2,
      createdAt: new Date(Date.now() - 86400_000).toISOString(),
    },
  ];
  mockVersionsByItem.set(soundId, initial);
  const original = getMockUploadedSound(soundId);
  mockVersionFiles.set(initial[0]!.id, {
    url: original?.objectUrl ?? DEMO_MP3,
    filename: original?.filename ?? 'original.mp3',
  });
  if (original) {
    initial[0]!.sourceFormat = sourceFormatFromName(original.filename);
    initial[0]!.versionLabel = 'Original upload';
  }
  return initial;
}

export async function fetchSoundVersions(soundId: string): Promise<{
  data: SoundVersion[];
  meta: FetchMeta;
}> {
  if (isForceMock()) {
    return {
      data: mockVersions(soundId).map((version) => ({ ...version })),
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data } = await requestJson<SoundVersion[]>(
      `/api/me/sound/${encodeURIComponent(soundId)}/versions`,
    );
    return { data, meta: { source: 'api' } };
  } catch (err) {
    return { data: [], meta: failMeta(err) };
  }
}

export async function activateSoundVersion(
  soundId: string,
  versionId: string,
): Promise<{ ok: true; data: SoundVersion[] } | { ok: false; error: string }> {
  if (isForceMock()) {
    const versions = mockVersions(soundId).map((v) => ({
      ...v,
      isActive: v.id === versionId,
    }));
    mockVersionsByItem.set(soundId, versions);
    return { ok: true, data: versions };
  }
  try {
    const { data } = await requestJson<SoundVersion[]>(
      `/api/me/sound/${encodeURIComponent(soundId)}/versions/${encodeURIComponent(versionId)}/activate`,
      { method: 'POST' },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not switch version',
    };
  }
}

export async function fetchVersionDownloadUrl(
  soundId: string,
  versionId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    const stored = mockVersionFiles.get(versionId);
    return { ok: true, url: stored?.url ?? DEMO_MP3 };
  }
  try {
    const { data } = await requestJson<{ url: string; contentType: string }>(
      `/api/me/sound/${encodeURIComponent(soundId)}/versions/${encodeURIComponent(versionId)}/download`,
    );
    return { ok: true, url: data.url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Download unavailable',
    };
  }
}

export async function uploadSoundVersion(
  soundId: string,
  file: File,
  versionLabel: string,
): Promise<
  | { ok: true; versionId: string; versionNumber: number; status: string }
  | { ok: false; error: string }
> {
  const label = versionLabel.trim() || file.name || 'New revision';
  if (isForceMock()) {
    const row = addMockSoundVersion(soundId, {
      versionLabel: label,
      url: URL.createObjectURL(file),
      filename: file.name,
    });
    return {
      ok: true,
      versionId: row.id,
      versionNumber: row.versionNumber,
      status: row.status,
    };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadId: string;
      uploadUrl: string;
    }>(`/api/me/sound/${encodeURIComponent(soundId)}/versions/prepare`, {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'audio/mpeg',
      }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'audio/mpeg' },
    });
    if (!put.ok) {
      throw new Error(`Upload PUT failed (${put.status})`);
    }
    const { data: done } = await requestJson<{
      versionId: string;
      versionNumber: number;
      status: string;
    }>(`/api/me/sound/${encodeURIComponent(soundId)}/versions/complete`, {
      method: 'POST',
      body: JSON.stringify({
        uploadId: prep.uploadId,
        versionLabel: label,
        fileSizeBytes: file.size,
      }),
    });
    return {
      ok: true,
      versionId: done.versionId,
      versionNumber: done.versionNumber,
      status: done.status,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not save revision',
    };
  }
}
