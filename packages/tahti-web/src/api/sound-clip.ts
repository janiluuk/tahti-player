import { isForceMock } from './mode';
import { requestJson } from './request-json';

export const SOUND_CLIP_MAX_DURATION_SEC = 60;

/** Cut a ≤60 s station-ID / announcement clip from a track. It lands in the
 * channel's announcements, switched off and processing until rendered. */
export async function createClipFromSound(
  soundId: string,
  input: { startSec: number; endSec: number; title?: string },
): Promise<
  | { ok: true; data: { clipId: string; title: string; durationSec: number } }
  | { ok: false; error: string }
> {
  if (isForceMock()) {
    return {
      ok: true,
      data: {
        clipId: `mock-clip-${Date.now()}`,
        title: input.title ?? 'Clip',
        durationSec: Math.round(input.endSec - input.startSec),
      },
    };
  }
  try {
    const { data } = await requestJson<{
      clipId: string;
      title: string;
      durationSec: number;
    }>(`/api/me/sound/${encodeURIComponent(soundId)}/editor/create-clip`, {
      method: 'POST',
      body: JSON.stringify({
        startSec: input.startSec,
        endSec: input.endSec,
        ...(input.title?.trim() ? { title: input.title.trim() } : {}),
      }),
    });
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not make the clip',
    };
  }
}
