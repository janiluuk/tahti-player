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

/** Mock: keyed tracks by tempo, the rest unplaced (the API walks the Camelot wheel). */
function mockMixOrder(tracks: MixOrderTrack[]): MixOrder {
  const keyed = tracks.filter((t) => t.key);
  return {
    items: [...keyed]
      .sort((a, b) => (a.bpm ?? Infinity) - (b.bpm ?? Infinity))
      .map((t) => ({ ...t, camelot: t.key ?? '' })),
    unplaced: tracks.filter((t) => !t.key),
  };
}

/** `POST /api/me/sound/suggest-playlist`: your selected sounds in mix order. Nothing is saved. */
export async function suggestSoundMixOrder(
  tracks: MixOrderTrack[],
): Promise<{ ok: true; data: MixOrder } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, data: mockMixOrder(tracks) };
  }
  try {
    const { data } = await requestJson<MixOrder>(
      '/api/me/sound/suggest-playlist',
      {
        method: 'POST',
        body: JSON.stringify({ ids: tracks.map((t) => t.id) }),
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
