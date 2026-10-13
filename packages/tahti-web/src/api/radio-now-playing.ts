import { getJson } from './http';
import { isForceMock } from './mode';
import { readIcyStreamTitle } from './radio-sources';

type StationProgramme = { title: string | null; artist: string | null };

const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; value: string | null }>();

// Shorter than the 30 s poll so each poller still gets a fresh answer every
// interval, while the player bar, the station page and Listen polling the
// same station share one request.
const NOW_PLAYING_CACHE_MS = 25_000;
const nowPlayingCache = new Map<
  string,
  { at: number; value: Promise<string | null> }
>();

/** "Programme · Artist — Track" from the two fields the API reads off a
 * station's programme page; null when it has neither. */
export function formatStationProgramme(
  programme: StationProgramme | null,
): string | null {
  const parts = [programme?.title, programme?.artist]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** What a station's own programme page says is on, via the API. Null when
 * the API has no parser for that station or the page gave nothing. Results
 * are kept for a minute, matching the API's own cache. */
export async function fetchStationProgramme(
  programmingUrl: string,
): Promise<string | null> {
  if (isForceMock()) {
    return null;
  }
  const cached = cache.get(programmingUrl);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.value;
  }
  let value: string | null;
  try {
    value = formatStationProgramme(
      await getJson<StationProgramme>(
        `/api/v1/internet-radio/now-playing?url=${encodeURIComponent(programmingUrl)}`,
      ),
    );
  } catch {
    value = null;
  }
  cache.set(programmingUrl, { at: Date.now(), value });
  return value;
}

/** What is on a station right now: its programme page first (programme and
 * track), then the title the stream itself announces. Callers asking about
 * the same station within 25 seconds share one lookup. */
export function fetchStationNowPlaying(station: {
  programmingUrl?: string | null;
  streamUrl?: string | null;
}): Promise<string | null> {
  const key = `${station.programmingUrl ?? ''}\n${station.streamUrl ?? ''}`;
  const cached = nowPlayingCache.get(key);
  if (cached && Date.now() - cached.at < NOW_PLAYING_CACHE_MS) {
    return cached.value;
  }
  const value = lookUpStationNowPlaying(station);
  nowPlayingCache.set(key, { at: Date.now(), value });
  return value;
}

async function lookUpStationNowPlaying(station: {
  programmingUrl?: string | null;
  streamUrl?: string | null;
}): Promise<string | null> {
  if (station.programmingUrl) {
    const programme = await fetchStationProgramme(station.programmingUrl);
    if (programme) {
      return programme;
    }
  }
  if (!station.streamUrl) {
    return null;
  }
  return readIcyStreamTitle(station.streamUrl).catch(() => null);
}

export function clearStationProgrammeCache() {
  cache.clear();
  nowPlayingCache.clear();
}
