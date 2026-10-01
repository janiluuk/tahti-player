import { isForceMock } from '../mode';
import { requestJson } from '../request-json';

/** Presigned URL (5 minutes) for your own release track. Opus by default;
 * FLAC needs a paid tier. */
export async function downloadStudioReleaseTrack(
  releaseId: string,
  trackId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, url: 'https://example.com/mock-release-track.opus' };
  }
  try {
    const { data } = await requestJson<{ url: string }>(
      `/api/me/releases/${encodeURIComponent(releaseId)}/tracks/${encodeURIComponent(trackId)}/download`,
    );
    return { ok: true, url: data.url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Download failed',
    };
  }
}
