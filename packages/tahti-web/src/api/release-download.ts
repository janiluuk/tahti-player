import { isForceMock } from './mode';
import { requestJson } from './request-json';

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
 * linked sound's subscriber/purchase gate and download rate limits. */
export async function downloadReleaseTrack(
  smartLinkSlug: string,
  trackId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, url: 'https://example.com/mock-download.opus' };
  }
  try {
    const { data } = await requestJson<{ url: string }>(
      `/api/v1/releases/${encodeURIComponent(smartLinkSlug)}/tracks/${encodeURIComponent(trackId)}/download`,
    );
    return { ok: true, url: data.url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Download failed',
    };
  }
}
