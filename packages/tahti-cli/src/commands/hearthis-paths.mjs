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

export function resolveAlbumTitle(set, permalink) {
  return set?.title || permalink || 'Unknown Set';
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
