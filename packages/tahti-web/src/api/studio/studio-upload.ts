import type { FetchMeta } from '../client';
import { getMockSessionUser } from '../mock-session';
import { registerMockUploadedSound } from '../mock-uploads';
import { isForceMock } from '../mode';
import { mockSoundStore } from './studio-mock';
import { requestJson } from './studio-request';

// ── Upload ──────────────────────────────────────────────────────────────────

export async function uploadSoundFile(input: {
  file: File;
  title?: string;
}): Promise<
  { ok: true; itemId: string; meta: FetchMeta } | { ok: false; error: string }
> {
  if (isForceMock()) {
    const id = `arch-mock-${Date.now()}`;
    const channelSlug = getMockSessionUser()?.username ?? 'demo';
    const filename = input.file.name || 'upload.wav';
    const fallbackTitle = filename.replace(/\.[^.]+$/, '') || filename;
    const title = input.title?.trim() || fallbackTitle;
    const mime = input.file.type || 'audio/wav';
    const format = mime.includes('flac')
      ? 'flac'
      : mime.includes('mpeg') || mime.includes('mp3')
        ? 'mp3'
        : mime.includes('ogg')
          ? 'ogg'
          : 'wav';
    mockSoundStore.unshift({
      id,
      title,
      status: 'READY',
      durationSec: 180,
      sourceFormat: format,
      sourceSampleRateHz: 44100,
      sourceBitDepth: format === 'mp3' || format === 'ogg' ? null : 16,
      sourceChannels: 2,
      sourceBitrateKbps: format === 'mp3' ? 320 : null,
      isPublic: false,
      downloadsEnabled: true,
      createdAt: new Date().toISOString(),
    });
    await registerMockUploadedSound({
      id,
      title,
      filename,
      objectUrl: URL.createObjectURL(input.file),
      channelSlug,
      downloadsEnabled: true,
      visibility: 'PRIVATE',
      mimeType: input.file.type || 'audio/wav',
    });
    return {
      ok: true,
      itemId: id,
      meta: { source: 'mock', reason: 'VITE_FORCE_MOCK' },
    };
  }
  try {
    const { data: prep } = await requestJson<{
      uploadId: string;
      uploadUrl: string;
    }>('/api/uploads/prepare', {
      method: 'POST',
      body: JSON.stringify({
        filename: input.file.name,
        contentType: input.file.type || 'audio/mpeg',
        fileSizeBytes: input.file.size,
        ...(input.title ? { title: input.title } : {}),
      }),
    });
    const put = await fetch(prep.uploadUrl, {
      method: 'PUT',
      body: input.file,
      headers: { 'Content-Type': input.file.type || 'audio/mpeg' },
    });
    if (!put.ok) {
      throw new Error(`Upload PUT failed (${put.status})`);
    }
    const etag =
      put.headers.get('etag') ?? put.headers.get('ETag') ?? '"mock-etag"';
    const { data: done } = await requestJson<{ itemId: string }>(
      '/api/uploads/complete',
      {
        method: 'POST',
        body: JSON.stringify({
          uploadId: prep.uploadId,
          etag: etag.replace(/"/g, ''),
          ...(input.title ? { title: input.title } : {}),
        }),
      },
    );
    return { ok: true, itemId: done.itemId, meta: { source: 'api' } };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}
