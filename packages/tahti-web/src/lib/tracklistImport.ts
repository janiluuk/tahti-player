import type { TracklistEntry } from '../api/studio-types';

function parseTimestamp(value: string): number | null {
  const parts = value.trim().split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part)) || parts.length > 3) {
    return null;
  }
  return parts.reduce((total, part) => total * 60 + part, 0);
}

const TIMESTAMP_TOKEN = '\\d{1,2}(?::\\d{1,2}){1,2}';
// "Artist - Track - 12:14" (or just "Track 12:14") — timestamp at the end.
const TRAILING_TIMESTAMP = new RegExp(
  `^(.*?)\\s*(?:[-–—|]\\s*)?(${TIMESTAMP_TOKEN})$`,
);
// "12:14 Artist - Track" (or "12:14 - Track") — timestamp at the start.
const LEADING_TIMESTAMP = new RegExp(
  `^(${TIMESTAMP_TOKEN})\\s*(?:[-–—|]\\s*)?(.*)$`,
);

/** Pulls a leading or trailing "M:SS"/"H:MM:SS" timestamp off a pasted
 * tracklist line, in whichever position it appears — the rest of the line
 * becomes the title. No timestamp in either position leaves the whole
 * line as the title. */
function splitTimestamp(line: string): {
  title: string;
  startSec: number | null;
} {
  const trailing = line.match(TRAILING_TIMESTAMP);
  if (trailing?.[1]?.trim()) {
    return {
      title: trailing[1].trim(),
      startSec: parseTimestamp(trailing[2]!),
    };
  }
  const leading = line.match(LEADING_TIMESTAMP);
  if (leading?.[2]?.trim()) {
    return { title: leading[2].trim(), startSec: parseTimestamp(leading[1]!) };
  }
  return { title: line, startSec: null };
}

function parsePlainTextTracklist(text: string): TracklistEntry[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const { title, startSec } = splitTimestamp(line);
      return {
        id: `track-${Date.now()}-${index}`,
        title: title || line,
        artist: null,
        startSec,
      };
    });
}

function collectionKey(entry: Element): string | null {
  const location = entry.querySelector('LOCATION');
  if (!location) {
    return null;
  }
  const volume = location.getAttribute('VOLUME') ?? '';
  const dir = location.getAttribute('DIR') ?? '';
  const file = location.getAttribute('FILE') ?? '';
  return `${volume}${dir}${file}` || null;
}

type CollectionTrack = { title: string | null; artist: string | null };

function buildCollectionIndex(doc: Document): Map<string, CollectionTrack> {
  const index = new Map<string, CollectionTrack>();
  for (const entry of Array.from(doc.querySelectorAll('COLLECTION > ENTRY'))) {
    const key = collectionKey(entry);
    if (!key) {
      continue;
    }
    index.set(key, {
      title: entry.getAttribute('TITLE')?.trim() || null,
      artist: entry.getAttribute('ARTIST')?.trim() || null,
    });
  }
  return index;
}

function resolvePlaylistEntry(
  entry: Element,
  collectionIndex: Map<string, CollectionTrack>,
  fallbackIndex: number,
): { title: string; artist: string | null } {
  const key = entry.querySelector('PRIMARYKEY')?.getAttribute('KEY') ?? null;
  const track = key ? collectionIndex.get(key) : undefined;
  const fileName = key
    ?.split(/[/\\]/)
    .pop()
    ?.replace(/\.[a-z0-9]+$/i, '');
  return {
    title: track?.title || fileName || `Track ${fallbackIndex + 1}`,
    artist: track?.artist ?? null,
  };
}

/** Traktor exports a playlist as a NML file with the full library in
 * COLLECTION and the playlist's track order in PLAYLISTS — entries there
 * only carry a LOCATION key, so title/artist have to be resolved back
 * through the collection. History playlists (TYPE="PROTOCOL") additionally
 * carry per-play EXTENDEDDATA with a STARTTIME and a PLAYEDPUBLIC flag for
 * tracks that were only briefly cued, not actually played. */
function parseTraktorNml(text: string): TracklistEntry[] {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const collectionIndex = buildCollectionIndex(doc);
  const playlist = doc.querySelector('PLAYLISTS PLAYLIST');
  if (!playlist) {
    return [];
  }
  const entries = Array.from(playlist.querySelectorAll('ENTRY'));

  if (playlist.getAttribute('TYPE') === 'PROTOCOL') {
    const played = entries
      .map((entry) => {
        const data = entry.querySelector('EXTENDEDDATA');
        return {
          entry,
          playedPublic: data?.getAttribute('PLAYEDPUBLIC') === '1',
          startTime: Number(data?.getAttribute('STARTTIME')),
        };
      })
      .filter((row) => row.playedPublic && Number.isFinite(row.startTime));
    const firstStartTime = played[0]?.startTime ?? 0;
    return played.map((row, index) => {
      const { title, artist } = resolvePlaylistEntry(
        row.entry,
        collectionIndex,
        index,
      );
      return {
        id: `track-${Date.now()}-${index}`,
        title,
        artist,
        startSec: Math.max(0, Math.round(row.startTime - firstStartTime)),
      };
    });
  }

  return entries.map((entry, index) => {
    const { title, artist } = resolvePlaylistEntry(
      entry,
      collectionIndex,
      index,
    );
    return {
      id: `track-${Date.now()}-${index}`,
      title,
      artist,
      startSec: null,
    };
  });
}

function looksLikeRekordboxExport(text: string): boolean {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const columns = firstLine.split('\t').map((column) => column.trim());
  return columns.includes('Track Title') && columns.includes('Artist');
}

/** Rekordbox's "Export to file" (playlist or play history) writes a
 * tab-separated table with a "Time" column holding each track's play
 * duration, not a timestamp — start times are reconstructed by summing
 * durations in file order. */
function parseRekordboxText(text: string): TracklistEntry[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return [];
  }
  const headers = lines[0]!.split('\t').map((header) => header.trim());
  const titleIndex = headers.indexOf('Track Title');
  const artistIndex = headers.indexOf('Artist');
  const timeIndex = headers.indexOf('Time');
  if (titleIndex === -1) {
    return [];
  }

  let cursorSec = 0;
  return lines.slice(1).map((line, index) => {
    const columns = line.split('\t');
    const title = columns[titleIndex]?.trim() || `Track ${index + 1}`;
    const artist =
      artistIndex >= 0 ? columns[artistIndex]?.trim() || null : null;
    const durationSec =
      timeIndex >= 0 ? parseTimestamp(columns[timeIndex] ?? '') : null;
    const entry: TracklistEntry = {
      id: `track-${Date.now()}-${index}`,
      title,
      artist,
      startSec: cursorSec,
    };
    cursorSec += durationSec ?? 0;
    return entry;
  });
}

export function parseTracklist(
  text: string,
  filename: string,
): TracklistEntry[] {
  if (
    filename.toLowerCase().endsWith('.nml') ||
    text.trimStart().startsWith('<')
  ) {
    return parseTraktorNml(text);
  }
  if (looksLikeRekordboxExport(text)) {
    return parseRekordboxText(text);
  }
  return parsePlainTextTracklist(text);
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () =>
      reject(reader.error ?? new Error('Could not read tracklist file'));
    reader.readAsArrayBuffer(file);
  });
}

/** Rekordbox's text export is UTF-16 (with a byte-order-mark) rather than
 * UTF-8, so a plain `file.text()` mangles it — decode by sniffing the BOM. */
export async function readTracklistFile(file: File): Promise<string> {
  const buffer = await readFileAsArrayBuffer(file);
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(buffer);
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(buffer);
  }
  return new TextDecoder('utf-8').decode(buffer);
}
