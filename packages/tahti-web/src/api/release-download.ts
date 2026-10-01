import { listenerFingerprint } from '../lib/listenerFingerprint';
import { apiBase } from './http';
import { isForceMock } from './mode';

/** One release track as `GET /api/v1/r/:slug` returns it. `audioUrl` is
 * null when the viewer can't play it (subscriber-only or paid). */
export type SmartLinkTrack = {
  id?: string;
  title: string;
  position: number;
  isrc?: string | null;
  audioUrl?: string | null;
  gate?: string | null;
};

/** Presigned URL for one published release track; the API applies the
 * linked sound's subscriber/purchase and follow/share gates and download
 * rate limits. `unlockSoundId` is the track to clear a follow/share gate on. */
export async function downloadReleaseTrack(
  smartLinkSlug: string,
  trackId: string,
): Promise<
  | { ok: true; url: string }
  | { ok: false; error: string; unlockSoundId?: string }
> {
  if (isForceMock()) {
    return { ok: true, url: 'https://example.com/mock-download.opus' };
  }
  try {
    const res = await fetch(
      `${apiBase()}/api/v1/releases/${encodeURIComponent(smartLinkSlug)}/tracks/${encodeURIComponent(trackId)}/download?fp=${encodeURIComponent(listenerFingerprint())}`,
      { credentials: 'include', headers: { Accept: 'application/json' } },
    );
    const body = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
      gates?: string[];
      soundId?: string;
    };
    if (res.ok && body.url) {
      return { ok: true, url: body.url };
    }
    return {
      ok: false,
      error: body.error ?? 'Download failed',
      ...(body.gates?.length && body.soundId
        ? { unlockSoundId: body.soundId }
        : {}),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Download failed',
    };
  }
}
