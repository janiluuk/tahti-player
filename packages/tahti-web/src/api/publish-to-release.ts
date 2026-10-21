import { isForceMock } from './mode';
import { requestJson } from './request-json';

/** Add this sound (or one of its ready versions) to a release as a new
 * last track; the release track is transcoded before it can play. */
export async function publishSoundToRelease(
  soundId: string,
  input: { releaseId: string; versionId?: string; title?: string },
): Promise<
  | { ok: true; data: { trackId: string; status: string } }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      data: { trackId: `mock-track-${Date.now()}`, status: 'SCANNING' },
    };
  }
  try {
    const { data } = await requestJson<{ trackId: string; status: string }>(
      `/api/me/sound/${encodeURIComponent(soundId)}/editor/publish-to-release`,
      {
        method: 'POST',
        body: JSON.stringify({
          releaseId: input.releaseId,
          ...(input.versionId ? { versionId: input.versionId } : {}),
          ...(input.title?.trim() ? { title: input.title.trim() } : {}),
        }),
      },
    );
    return { ok: true, data: { trackId: data.trackId, status: data.status } };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : 'Could not add it to the release',
    };
  }
}
