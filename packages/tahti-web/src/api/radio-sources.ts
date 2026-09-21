import type { TahtiPlayable } from './types';

/** A resolved, playable internet radio stream. */
export type RadioStation = {
  /** Stable id — the stream URL, used as a dedupe/cache key. */
  id: string;
  name: string;
  streamUrl: string;
  homepage?: string;
  favicon?: string;
  tags?: string[];
  countryCode?: string;
  country?: string;
  codec?: string;
  bitrateKbps?: number;
  /** Where the metadata came from. */
  source: 'radio-browser' | 'm3u' | 'manual' | 'unknown';
};

/** A curated list of well-known, freely streamable public stations —
 * used as a manual fallback when a pasted URL can't be resolved. */
export const COMMON_STATIONS: RadioStation[] = [
  {
    id: 'https://ice1.somafm.com/groovesalad-256-mp3',
    name: 'SomaFM: Groove Salad',
    streamUrl: 'https://ice1.somafm.com/groovesalad-256-mp3',
    homepage: 'https://somafm.com/groovesalad/',
    tags: ['ambient', 'downtempo'],
    codec: 'MP3',
    bitrateKbps: 256,
    source: 'manual',
  },
  {
    id: 'https://ice1.somafm.com/dronezone-256-mp3',
    name: 'SomaFM: Drone Zone',
    streamUrl: 'https://ice1.somafm.com/dronezone-256-mp3',
    homepage: 'https://somafm.com/dronezone/',
    tags: ['ambient', 'space'],
    codec: 'MP3',
    bitrateKbps: 256,
    source: 'manual',
  },
  {
    id: 'https://ice1.somafm.com/beatblender-256-mp3',
    name: 'SomaFM: Beat Blender',
    streamUrl: 'https://ice1.somafm.com/beatblender-256-mp3',
    homepage: 'https://somafm.com/beatblender/',
    tags: ['electronic', 'downtempo'],
    codec: 'MP3',
    bitrateKbps: 256,
    source: 'manual',
  },
  {
    id: 'https://ice1.somafm.com/indiepop-128-mp3',
    name: 'SomaFM: Indie Pop Rocks!',
    streamUrl: 'https://ice1.somafm.com/indiepop-128-mp3',
    homepage: 'https://somafm.com/indiepop/',
    tags: ['indie', 'pop'],
    codec: 'MP3',
    bitrateKbps: 128,
    source: 'manual',
  },
  {
    id: 'https://stream.wqxr.org/wqxr',
    name: 'WQXR (Classical, NYC)',
    streamUrl: 'https://stream.wqxr.org/wqxr',
    homepage: 'https://www.wqxr.org/',
    tags: ['classical'],
    source: 'manual',
  },
];

/** True if the resolved content looks like an M3U/M3U8 playlist rather than raw audio. */
function looksLikeM3u(text: string, contentType: string | null): boolean {
  if (contentType && /mpegurl|m3u/i.test(contentType)) {
    return true;
  }
  return text.trimStart().startsWith('#EXTM3U') || /\.m3u8?(\?|$)/i.test(text);
}

export type M3uEntry = { url: string; title?: string };

/** Parses M3U/M3U8 text into stream entries — ignores HLS tag lines (#EXT-X-*). */
export function parseM3u(text: string): M3uEntry[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const entries: M3uEntry[] = [];
  let pendingTitle: string | undefined;

  for (const line of lines) {
    if (!line) {
      continue;
    }
    if (line.startsWith('#EXTINF:')) {
      const comma = line.indexOf(',');
      pendingTitle = comma >= 0 ? line.slice(comma + 1).trim() : undefined;
      continue;
    }
    if (line.startsWith('#')) {
      continue;
    }
    entries.push({ url: line, title: pendingTitle });
    pendingTitle = undefined;
  }
  return entries;
}

/**
 * Resolves a pasted URL to a playable stream URL: fetches it, and if it's an
 * M3U/M3U8 playlist, parses it and returns the first entry; otherwise treats
 * the URL itself as the stream.
 */
export async function resolveStreamUrl(inputUrl: string): Promise<{
  streamUrl: string;
  title?: string;
  wasPlaylist: boolean;
}> {
  try {
    const res = await fetch(inputUrl, { method: 'GET' });
    const contentType = res.headers.get('content-type');
    const text = await res.clone().text();
    if (looksLikeM3u(text, contentType)) {
      const entries = parseM3u(text);
      if (entries.length > 0) {
        return {
          streamUrl: entries[0].url,
          title: entries[0].title,
          wasPlaylist: true,
        };
      }
    }
  } catch {
    // Not fetchable as text (likely binary audio, or CORS-blocked) — fall
    // through and treat the input as a direct stream URL.
  }
  return { streamUrl: inputUrl, wasPlaylist: false };
}

type RadioBrowserStation = {
  stationuuid: string;
  name: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  codec: string;
  bitrate: number;
};

function fromRadioBrowser(s: RadioBrowserStation): RadioStation {
  return {
    id: s.url_resolved || s.stationuuid,
    name: s.name,
    streamUrl: s.url_resolved,
    homepage: s.homepage || undefined,
    favicon: s.favicon || undefined,
    tags: s.tags ? s.tags.split(',').filter(Boolean) : undefined,
    countryCode: s.countrycode || undefined,
    country: s.country || undefined,
    codec: s.codec || undefined,
    bitrateKbps: s.bitrate || undefined,
    source: 'radio-browser',
  };
}

const RADIO_BROWSER_BASE = 'https://de1.api.radio-browser.info/json';

/** Looks up station metadata for a stream URL via the public Radio Browser
 * directory (radio-browser.info) — a community database, not a live
 * "now playing" feed. Returns null if the station isn't listed. */
export async function lookupStationByUrl(
  streamUrl: string,
): Promise<RadioStation | null> {
  try {
    const res = await fetch(
      `${RADIO_BROWSER_BASE}/stations/byurl/${encodeURIComponent(streamUrl)}`,
    );
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as
      RadioBrowserStation[] | RadioBrowserStation;
    const first = Array.isArray(data) ? data[0] : data;
    return first ? fromRadioBrowser(first) : null;
  } catch {
    return null;
  }
}

/** Searches the Radio Browser directory by name — used when a URL lookup misses. */
export async function searchStationsByName(
  query: string,
): Promise<RadioStation[]> {
  if (!query.trim()) {
    return [];
  }
  try {
    const res = await fetch(
      `${RADIO_BROWSER_BASE}/stations/search?name=${encodeURIComponent(query)}&limit=10&hidebroken=true`,
    );
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as RadioBrowserStation[];
    return data.map(fromRadioBrowser);
  } catch {
    return [];
  }
}

export type RadioBrowserSearch = {
  name?: string;
  /** Exact tag/genre match, e.g. "jazz". */
  tag?: string;
  /** Comma-separated tags (radio-browser.info `tagList`). Prefer over `tag`
   * when multiple genres are selected. */
  tags?: string[];
  /** ISO 3166-1 alpha-2 country code, e.g. "FI". */
  countryCode?: string;
  limit?: number;
  order?: 'clickcount' | 'votes' | 'name' | 'bitrate';
};

/** Combined directory search — name, genre tag, and country filter can all
 * apply together (radio-browser.info's own `/stations/search` supports all
 * three as one query, so filters narrow the same result set the text search
 * runs against, rather than being separate lookups). */
export async function searchStations(
  filters: RadioBrowserSearch,
): Promise<RadioStation[]> {
  const params = new URLSearchParams({
    limit: String(filters.limit ?? 30),
    hidebroken: 'true',
    order: filters.order ?? 'clickcount',
    reverse: 'true',
  });
  if (filters.name?.trim()) {
    params.set('name', filters.name.trim());
  }
  const tagList = (filters.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  if (tagList.length > 1) {
    params.set('tagList', tagList.join(','));
  } else if (tagList.length === 1) {
    params.set('tag', tagList[0]!);
  } else if (filters.tag) {
    params.set('tag', filters.tag);
  }
  if (filters.countryCode) {
    params.set('countrycode', filters.countryCode);
  }
  try {
    const res = await fetch(`${RADIO_BROWSER_BASE}/stations/search?${params}`);
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as RadioBrowserStation[];
    return data.map(fromRadioBrowser);
  } catch {
    return [];
  }
}

/** Total public station count, for the directory banner ("Discover over N
 * public stations") — best-effort, callers should tolerate `null`. */
export async function fetchStationCount(): Promise<number | null> {
  try {
    const res = await fetch(`${RADIO_BROWSER_BASE}/stats`);
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as { stations?: number };
    return typeof data.stations === 'number' ? data.stations : null;
  } catch {
    return null;
  }
}

export type RadioBrowserCountry = {
  code: string;
  name: string;
  stationCount: number;
};

/** Countries with at least one listed station, for the country filter —
 * sorted by station count, most-represented first. */
export async function fetchCountryList(): Promise<RadioBrowserCountry[]> {
  try {
    const res = await fetch(`${RADIO_BROWSER_BASE}/countries`);
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as Array<{
      name: string;
      iso_3166_1: string;
      stationcount: number;
    }>;
    return data
      .filter((c) => c.iso_3166_1 && c.name)
      .map((c) => ({
        code: c.iso_3166_1,
        name: c.name,
        stationCount: c.stationcount,
      }))
      .sort((a, b) => b.stationCount - a.stationCount);
  } catch {
    return [];
  }
}

export type RadioBrowserTag = {
  name: string;
  stationCount: number;
};

/** Most-used genre tags, for the genre filter — capped at `limit` since the
 * full tag list runs into the tens of thousands of mostly-unused values. */
export async function fetchTagList(limit = 60): Promise<RadioBrowserTag[]> {
  try {
    const res = await fetch(
      `${RADIO_BROWSER_BASE}/tags?order=stationcount&reverse=true&limit=${limit}`,
    );
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as Array<{
      name: string;
      stationcount: number;
    }>;
    return data.map((t) => ({ name: t.name, stationCount: t.stationcount }));
  } catch {
    return [];
  }
}

export type RadioStreamTestResult = {
  ok: boolean;
  status?: number;
  message: string;
};

/**
 * Best-effort reachability check for a stream URL, run from the browser —
 * there's no server-side test route for arbitrary radio streams (unlike
 * multistream RTMP targets, which the Tahti API tests server-side). A
 * failed fetch here is genuinely ambiguous: it can mean the stream is
 * actually down, or just that its server doesn't set CORS headers on the
 * audio endpoint (common for Icecast/Shoutcast) — the browser reports both
 * as the same opaque network error. `ok: true` is a real, positive signal;
 * `ok: false` is reported honestly as "couldn't verify," not "confirmed
 * down."
 */
export async function testRadioStream(
  streamUrl: string,
  timeoutMs = 6000,
): Promise<RadioStreamTestResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(streamUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    if (res.ok) {
      return {
        ok: true,
        status: res.status,
        message: `Stream responded (HTTP ${res.status}).`,
      };
    }
    return {
      ok: false,
      status: res.status,
      message: `Stream returned HTTP ${res.status}.`,
    };
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return {
        ok: false,
        message: `No response within ${Math.round(timeoutMs / 1000)}s.`,
      };
    }
    return {
      ok: false,
      message:
        "Couldn't reach this stream from your browser — it may be offline, or its server may not allow cross-origin requests (this doesn't always mean the stream is actually down).",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Best-effort read of the live ICY "StreamTitle" (what's currently playing)
 * directly from the stream's interleaved metadata. Many Icecast/Shoutcast
 * servers don't set CORS headers on the audio endpoint, so this frequently
 * can't work from a browser — callers should treat a null result as normal,
 * not an error, and fall back to static station info.
 */
export async function readIcyStreamTitle(
  streamUrl: string,
  timeoutMs = 4000,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(streamUrl, {
      headers: { 'Icy-MetaData': '1' },
      signal: controller.signal,
    });
    const metaint = Number(res.headers.get('icy-metaint'));
    if (!res.body || !Number.isFinite(metaint) || metaint <= 0) {
      return null;
    }
    const reader = res.body.getReader();
    let buffered = new Uint8Array(0);
    let audioBytesToSkip = metaint;

    const append = (chunk: Uint8Array) => {
      const next = new Uint8Array(buffered.length + chunk.length);
      next.set(buffered, 0);
      next.set(chunk, buffered.length);
      buffered = next;
    };

    // Read until we've skipped `metaint` audio bytes, then the metadata block follows.
    while (audioBytesToSkip > 0) {
      const { value, done } = await reader.read();
      if (done || !value) {
        return null;
      }
      if (value.length <= audioBytesToSkip) {
        audioBytesToSkip -= value.length;
      } else {
        append(value.slice(audioBytesToSkip));
        audioBytesToSkip = 0;
      }
    }

    // Need at least the 1-byte metadata length prefix.
    while (buffered.length < 1) {
      const { value, done } = await reader.read();
      if (done || !value) {
        return null;
      }
      append(value);
    }

    const metaLength = buffered[0] * 16;
    if (metaLength === 0) {
      return null;
    }
    while (buffered.length < 1 + metaLength) {
      const { value, done } = await reader.read();
      if (done || !value) {
        break;
      }
      append(value);
    }

    const metaBytes = buffered.slice(1, 1 + metaLength);
    const metaText = new TextDecoder('utf-8', { fatal: false }).decode(
      metaBytes,
    );
    const match = /StreamTitle='([^']*)'/.exec(metaText);
    void reader.cancel().catch(() => {});
    return match ? match[1] : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function playableFromRadioStation(
  station: RadioStation,
  nowPlaying?: string | null,
): TahtiPlayable {
  return {
    id: `radio:${station.id}`,
    kind: 'radio',
    title: nowPlaying || station.name,
    artist: nowPlaying ? station.name : 'Internet radio',
    coverUrl: station.favicon,
    streamUrl: station.streamUrl,
    protocol: 'https',
    sourceProvider: 'radio',
  };
}
