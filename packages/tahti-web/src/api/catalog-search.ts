import { getJson, sendJson } from './http';
import { isForceMock } from './mode';

export type CatalogTrack = {
  id: string;
  title: string;
  durationSec: number | null;
  artistName: string;
  channelSlug: string;
};

const MOCK_CATALOG: CatalogTrack[] = [
  {
    id: 'arch-mock-1',
    title: 'Northern Lights — Live Set',
    durationSec: 3720,
    artistName: 'Demo Artist',
    channelSlug: 'demo',
  },
  {
    id: 'catalog-mock-2',
    title: 'Midnight Ferry',
    durationSec: 245,
    artistName: 'Aino',
    channelSlug: 'aino',
  },
  {
    id: 'catalog-mock-3',
    title: 'Frost Lines',
    durationSec: 312,
    artistName: 'Veikko',
    channelSlug: 'veikko',
  },
];

export async function searchCatalogTracks(
  q: string,
  offset = 0,
): Promise<
  | { ok: true; tracks: CatalogTrack[]; hasMore: boolean }
  | { ok: false; error: string }
> {
  const query = q.trim();
  if (isForceMock()) {
    const needle = query.toLowerCase();
    return {
      ok: true,
      tracks: MOCK_CATALOG.filter((track) =>
        track.title.toLowerCase().includes(needle),
      ),
      hasMore: false,
    };
  }
  try {
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
    }
    if (offset > 0) {
      params.set('offset', String(offset));
    }
    const qs = params.toString();
    const data = await getJson<{ tracks: CatalogTrack[]; hasMore: boolean }>(
      `/api/v1/search/tracks${qs ? `?${qs}` : ''}`,
    );
    return { ok: true, tracks: data.tracks, hasMore: data.hasMore };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Search failed',
    };
  }
}

export async function addTrackToCollaborativePlaylist(
  slug: string,
  soundId: string,
  note?: string,
): Promise<{ ok: true; itemId: string | null } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true, itemId: `mock-collab-${Date.now()}` };
  }
  const trimmed = note?.trim();
  try {
    const item = await sendJson<{ id?: string } | null>(
      `/api/v1/collections/${encodeURIComponent(slug)}/items`,
      'POST',
      { soundId, ...(trimmed ? { note: trimmed } : {}) },
    );
    return { ok: true, itemId: item?.id ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}

/** Takes back a track you added to someone's collaborative playlist. */
export async function removeOwnCollaborativeAdd(
  slug: string,
  itemId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isForceMock()) {
    return { ok: true };
  }
  try {
    await sendJson(
      `/api/v1/collections/${encodeURIComponent(slug)}/items/${encodeURIComponent(itemId)}`,
      'DELETE',
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed' };
  }
}
