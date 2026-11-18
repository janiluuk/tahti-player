import { isForceMock } from '../mode';
import { requestJson } from '../request-json';

export type MixOrderTrack = {
  id: string;
  title: string;
  bpm: number | null;
  key: string | null;
};

export type MixOrder = {
  /** Slowest keyed track first, then the smoothest key / tempo step each time. */
  items: Array<MixOrderTrack & { camelot: string }>;
  /** Tracks with no readable key, in the order they were sent. */
  unplaced: MixOrderTrack[];
};

/** Cap aligned with tahti-org `SuggestPlaylistBodySchema` (max 500 ids). */
export const STUDIO_SOUND_MIX_ORDER_MAX_IDS = 500;

/** Mock: keyed tracks by tempo, the rest unplaced (the API walks the Camelot wheel). */
function mockMixOrder(ids: string[]): MixOrder {
  return {
    items: ids.slice(0, Math.max(0, ids.length - 1)).map((id, index) => ({
      id,
      title: id,
      bpm: 120 + index,
      key: '8A',
      camelot: '8A',
    })),
    unplaced:
      ids.length > 0
        ? [
            {
              id: ids[ids.length - 1]!,
              title: ids[ids.length - 1]!,
              bpm: null,
              key: null,
            },
          ]
        : [],
  };
}

/** `POST /api/me/sound/suggest-playlist`: your selected sounds in mix order. Nothing is saved. */
export async function suggestSoundMixOrder(
  ids: string[],
): Promise<{ ok: true; data: MixOrder } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, data: mockMixOrder(ids) };
  }
  try {
    const { data } = await requestJson<MixOrder>(
      '/api/me/sound/suggest-playlist',
      {
        method: 'POST',
        body: JSON.stringify({ ids }),
      },
    );
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not suggest an order',
    };
  }
}
