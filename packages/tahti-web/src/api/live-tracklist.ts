import { getJson } from './http';
import { isForceMock } from './mode';

export type LiveTracklistEntry = {
  startSec: number;
  title: string;
  artist?: string;
  artistUsername?: string;
};

/**
 * Tracks identified so far in a channel's live broadcast
 * (`GET /api/channels/:slug/live-fingerprints`); empty when it isn't live.
 */
export async function fetchLiveTracklist(
  slug: string,
): Promise<LiveTracklistEntry[]> {
  if (isForceMock()) {
    return [
      { startSec: 0, title: 'Opening drone', artist: 'Night Drive' },
      { startSec: 412, title: 'Borrowed Light', artistUsername: 'nightdrive' },
    ];
  }
  try {
    const data = await getJson<{ tracklist?: LiveTracklistEntry[] }>(
      `/api/channels/${encodeURIComponent(slug)}/live-fingerprints`,
    );
    return Array.isArray(data.tracklist) ? data.tracklist : [];
  } catch {
    return [];
  }
}
