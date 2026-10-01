import { isForceMock } from './mode';
import { requestJson } from './request-json';

/** Pull a hearthis.at embed's real audio into Tahti (only when the artist
 * allowed downloads on hearthis.at); the item then plays Tahti-hosted audio
 * instead of the embed once the import job finishes. */
export async function importHearthisEmbedAudio(
  soundId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await requestJson(
      `/api/me/sound/${encodeURIComponent(soundId)}/import-embed`,
      { method: 'POST' },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not start the import',
    };
  }
}
