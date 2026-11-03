/**
 * Path helpers for hearthis.at discography downloads.
 * Layout: Artist/Album (year)/01 - Track.ext
 */

const MAX_SEGMENT = 120;

/** Characters Windows/macOS/Linux reject or that break shell paths. */
// Control chars (NUL–US) must be stripped from path segments.
// eslint-disable-next-line no-control-regex -- intentional C0 control strip
const UNSAFE = /[<>:"/\\|?*\u0000-\u001f]+/g;

export function sanitizePathSegment(value, fallback = 'Unknown') {
  const cleaned = String(value ?? '')
    .normalize('NFC')
    .replace(UNSAFE, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .trim()
    .replace(/[. ]+$/g, '');
  const segment = (cleaned || fallback).slice(0, MAX_SEGMENT);
  return segment || fallback;
}

/** Album folder: "Title (2024)" when year is known, else "Title". */
export function albumFolderName(title, year) {
  const base = sanitizePathSegment(title, 'Unknown Set');
  const y = Number(year);
  if (Number.isInteger(y) && y >= 1900 && y <= 2100) {
    return `${base} (${y})`;
  }
  return base;
}

export function trackFileStem(position, title) {
  const n = Math.max(1, Number(position) || 1);
  const num = String(n).padStart(2, '0');
  const name = sanitizePathSegment(title, 'Track');
  return `${num} - ${name}`;
}

/**
 * Prefer the original upload extension from hearthis (often .wav/.flac).
 * Falls back to content-type; never invents a compressed type when the
 * filename already says lossless.
 */
export function pickAudioExtension(downloadFilename, contentType) {
  const fromName = extensionFromName(downloadFilename);
  if (fromName && isLosslessExt(fromName)) {
    return fromName;
  }
  const fromType = extensionFromContentType(contentType);
  if (fromType && isLosslessExt(fromType)) {
    return fromType;
  }
  if (fromName) {
    return fromName;
  }
  if (fromType) {
    return fromType;
  }
  return 'bin';
}

function extensionFromName(fileName) {
  if (!fileName || !String(fileName).includes('.')) {
    return null;
  }
  const ext = String(fileName).split('.').pop()?.toLowerCase();
  return AUDIO_EXTS.has(ext) ? ext : null;
}

function extensionFromContentType(mimeType) {
  switch ((mimeType || '').split(';')[0].trim().toLowerCase()) {
    case 'audio/mpeg':
    case 'audio/mp3':
      return 'mp3';
    case 'audio/wav':
    case 'audio/x-wav':
    case 'audio/vnd.wave':
      return 'wav';
    case 'audio/flac':
    case 'audio/x-flac':
      return 'flac';
    case 'audio/aiff':
    case 'audio/x-aiff':
      return 'aiff';
    case 'audio/mp4':
    case 'audio/aac':
      return 'm4a';
    case 'audio/ogg':
    case 'audio/opus':
      return 'ogg';
    default:
      return null;
  }
}

const AUDIO_EXTS = new Set([
  'mp3',
  'flac',
  'wav',
  'aif',
  'aiff',
  'm4a',
  'aac',
  'ogg',
  'opus',
]);

function isLosslessExt(ext) {
  return ext === 'flac' || ext === 'wav' || ext === 'aif' || ext === 'aiff';
}

/**
 * Year for the album folder: set.year, else earliest track releaseDate year.
 */
export function resolveAlbumYear(set, tracks) {
  if (set?.year != null) {
    return set.year;
  }
  let best = null;
  for (const track of tracks ?? []) {
    const match = /^(\d{4})/.exec(String(track.releaseDate ?? '').trim());
    if (!match) {
      continue;
    }
    const year = Number.parseInt(match[1], 10);
    if (year >= 1900 && year <= 2100 && (best === null || year < best)) {
      best = year;
    }
  }
  return best;
}

export function resolveAlbumArtist(set, tracks) {
  return (
    set?.username ||
    tracks?.[0]?.username ||
    set?.userPermalink ||
    tracks?.[0]?.userPermalink ||
    'Unknown Artist'
  );
}

export function resolveAlbumTitle(set, permalink, title = null) {
  return title || set?.title || permalink || 'Unknown Set';
}

export function resolveSetOwner(set, tracks) {
  if (set?.userPermalink) {
    return set.userPermalink;
  }
  const counts = new Map();
  for (const track of tracks ?? []) {
    if (track.userPermalink) {
      counts.set(
        track.userPermalink,
        (counts.get(track.userPermalink) ?? 0) + 1,
      );
    }
  }
  let best = null;
  for (const [owner, count] of counts) {
    if (best === null || count > counts.get(best)) {
      best = owner;
    }
  }
  return best;
}

/** Relative path under --out: Artist/Album (year)/01 - Track.ext */
export function discographyRelativePath({
  artist,
  albumTitle,
  year,
  position,
  trackTitle,
  extension,
}) {
  const artistDir = sanitizePathSegment(artist, 'Unknown Artist');
  const albumDir = albumFolderName(albumTitle, year);
  const file = `${trackFileStem(position, trackTitle)}.${extension}`;
  return `${artistDir}/${albumDir}/${file}`;
}

export const DOWNLOAD_LAYOUTS = ['discography', 'album', 'set'];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function splitAlbumSetTitle(title, fallbackArtist) {
  const text = String(title ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = text.split(' - ');
  const artist = parts.length > 1 ? parts[0].trim() : fallbackArtist;
  let album = (parts.length > 1 ? parts[1] : parts[0]).trim();
  let year = null;
  const yearMatch = /\s*\((\d{4})\)\s*$/.exec(album);
  if (yearMatch) {
    year = Number(yearMatch[1]);
    album = album.slice(0, yearMatch.index).trim();
  }
  return { artist: artist || fallbackArtist, album: album || text, year };
}

export function cleanAlbumTrackTitle(title, { artist, album }) {
  let text = String(title ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  text = text.replace(
    /(^|\s-\s)[^-]*?\b(?:LP|EP)\s+-\s+\d{1,3}(?:\.\d+)?\s*[-.]\s*/i,
    (_match, lead) => lead,
  );
  if (album) {
    text = text.replace(
      new RegExp(
        `\\s+-\\s+${escapeRegExp(album)}\\s+-\\s+\\d{1,3}\\s+-\\s+`,
        'i',
      ),
      ' - ',
    );
  }
  if (artist) {
    text = text.replace(
      new RegExp(`^${escapeRegExp(artist)}\\s+-\\s+`, 'i'),
      '',
    );
  }
  return text || title;
}

export function layoutRelativePath(
  layout,
  { artist, setTitle, albumTitle, year, position, trackTitle, extension },
) {
  if (layout === 'set') {
    const setDir = sanitizePathSegment(setTitle, 'Unknown Set');
    const file = sanitizePathSegment(trackTitle, 'Track');
    return `${setDir}/${file}.${extension}`;
  }
  if (layout === 'album') {
    const split = splitAlbumSetTitle(setTitle, artist);
    const albumDir = albumFolderName(
      `${split.artist} - ${split.album}`,
      split.year ?? year,
    );
    const name = cleanAlbumTrackTitle(trackTitle, split);
    return `${albumDir}/${trackFileStem(position, name)}.${extension}`;
  }
  return discographyRelativePath({
    artist,
    albumTitle,
    year,
    position,
    trackTitle,
    extension,
  });
}
