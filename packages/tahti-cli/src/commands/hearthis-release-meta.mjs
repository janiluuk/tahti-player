import { CliError } from '../api-client.mjs';
import { largestCover, parseTrackSelection } from './hearthis-download-set.mjs';
import { resolveSetOwner } from './hearthis-paths.mjs';
import {
  fetchHearthisSetTracks,
  parseHearthisSetPermalink,
} from './hearthis-set.mjs';
import { HEARTHIS_API } from './hearthis-user-sets.mjs';
import { MAX_RELEASE_TRACKS, RELEASE_TYPES } from './releases-create.mjs';

const MAX_RELEASE_DESCRIPTION = 10_000;
const MAX_SOUND_DESCRIPTION = 2000;
const MAX_GENRE = 80;
const DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})/;

/**
 * What a pasted hearthis.at link points at: a Set
 * (`https://hearthis.at/set/<permalink>/` or a bare permalink) or a single
 * track (`https://hearthis.at/<user>/<track>/`).
 */
export function parseHearthisSource(input) {
  const value = typeof input === 'string' ? input.trim() : '';
  if (!value) {
    return null;
  }
  if (/^https?:\/\//i.test(value)) {
    let url;
    try {
      url = new URL(value);
    } catch {
      return null;
    }
    if (!/(^|\.)hearthis\.at$/.test(url.hostname)) {
      return null;
    }
    if (url.pathname.startsWith('/set/')) {
      const permalink = parseHearthisSetPermalink(value);
      return permalink ? { kind: 'set', permalink } : null;
    }
    const match = /^\/([^/]+)\/([^/]+)\/?$/.exec(url.pathname);
    return match
      ? {
          kind: 'track',
          user: decodeURIComponent(match[1]),
          track: decodeURIComponent(match[2]),
        }
      : null;
  }
  const permalink = parseHearthisSetPermalink(value);
  return permalink ? { kind: 'set', permalink } : null;
}

export function splitHearthisTags(value) {
  return String(value ?? '')
    .split(',')
    .map((tag) => tag.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 20);
}

/** One raw hearthis.at track in the shape the Tahti set-tracks route answers
 * (`toSetTrackResult` in tahti-org), plus the description, tags and BPM that
 * route leaves out. */
export function mapHearthisTrack(track, position) {
  const downloadable =
    track.downloadable === '1' && Boolean(track.download_url);
  return {
    id: String(track.id),
    url: track.permalink_url,
    title: String(track.title ?? '').trim(),
    username: track.user?.username ?? null,
    userPermalink: track.user?.permalink ?? null,
    durationSec: Number.parseInt(track.duration, 10) || 0,
    coverUrl: track.artwork_url ?? null,
    genre: track.genre?.trim() || null,
    position,
    kind: track.type?.trim() || null,
    releaseDate: track.release_date?.trim() || null,
    downloadable,
    downloadUrl: downloadable ? (track.download_url ?? null) : null,
    downloadFilename: downloadable ? (track.download_filename ?? null) : null,
    description: track.description?.trim() || null,
    tags: splitHearthisTags(track.tags),
    bpm: Number.parseInt(track.bpm, 10) || null,
  };
}

/** A single hearthis.at track as a one-track catalog, read from hearthis.at's
 * public API (the Tahti API only lists tracks inside Sets). */
export async function fetchHearthisTrackCatalog(
  user,
  track,
  { fetchImpl = fetch } = {},
) {
  const url = `${HEARTHIS_API}/${encodeURIComponent(user)}/${encodeURIComponent(track)}/`;
  let response;
  try {
    response = await fetchImpl(url);
  } catch (error) {
    throw new CliError(
      `Could not reach hearthis.at: ${error?.message ?? error}`,
    );
  }
  if (!response.ok) {
    throw new CliError(
      `hearthis.at answered HTTP ${response.status} for ${user}/${track}`,
    );
  }
  const body = await response.json();
  if (
    !body ||
    typeof body !== 'object' ||
    !body.id ||
    body.status === 'error'
  ) {
    throw new CliError(
      `hearthis.at has no track at https://hearthis.at/${user}/${track}/${body?.message ? ` (${body.message})` : ''}`,
    );
  }
  const mapped = mapHearthisTrack(body, 1);
  return {
    kind: 'track',
    permalink: `${user}-${track}`,
    url: mapped.url ?? `https://hearthis.at/${user}/${track}/`,
    set: null,
    tracks: [mapped],
  };
}

export async function fetchHearthisCatalog(config, input, options = {}) {
  const source = parseHearthisSource(input);
  if (!source) {
    throw new CliError(
      `Not a hearthis.at Set or track: ${input}\nExpected https://hearthis.at/set/<permalink>/, https://hearthis.at/<user>/<track>/ or a bare Set permalink.`,
    );
  }
  if (source.kind === 'track') {
    return fetchHearthisTrackCatalog(source.user, source.track, options);
  }
  const catalog = await fetchHearthisSetTracks(config, source.permalink);
  return { kind: 'set', ...catalog };
}

export function defaultReleaseType(trackCount) {
  if (trackCount <= 1) {
    return 'SINGLE';
  }
  return trackCount <= 6 ? 'EP' : 'ALBUM';
}

function datePart(value) {
  const match = DATE_PATTERN.exec(String(value ?? '').trim());
  if (!match || Number.isNaN(new Date(`${match[1]}T00:00:00Z`).getTime())) {
    return null;
  }
  return match[1];
}

function mostCommon(values) {
  const counts = new Map();
  for (const value of values) {
    if (value) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  let best = null;
  for (const [value, count] of counts) {
    if (best === null || count > counts.get(best)) {
      best = value;
    }
  }
  return best;
}

function todayIso(now) {
  return now.toISOString().slice(0, 10);
}

/**
 * Release metadata for a hearthis.at catalog: only the tracks uploaded by the
 * Set's owner, numbered 1..n in Set order (the same numbering
 * `downloadHearthisSet --own` uses), so `--tracks` picks the same positions.
 */
export function buildReleasePlan(
  catalog,
  { title = null, type = null, date = null, tracks = null } = {},
  now = new Date(),
) {
  const owner = resolveSetOwner(catalog.set, catalog.tracks);
  const own = catalog.tracks.filter(
    (track) => !owner || track.userPermalink === owner,
  );
  const others = catalog.tracks.length - own.length;
  const selection = tracks ? parseTrackSelection(tracks) : null;
  const planned = own
    .map((track, index) => ({ ...track, position: index + 1 }))
    .filter((track) => !selection || selection.has(track.position));
  if (planned.length === 0) {
    throw new CliError(
      selection
        ? `--tracks ${tracks} matches no track (the release has ${own.length}).`
        : `No tracks by the ${catalog.kind === 'track' ? 'track' : 'Set'}'s owner in ${catalog.url}.`,
    );
  }
  if (planned.length > MAX_RELEASE_TRACKS) {
    throw new CliError(
      `${planned.length} tracks is more than a release holds (${MAX_RELEASE_TRACKS}). Pick some with --tracks, e.g. --tracks 1-${MAX_RELEASE_TRACKS}.`,
    );
  }
  const first = planned[0];
  const releaseTitle = (
    title ||
    catalog.set?.title ||
    (catalog.kind === 'track' ? first.title : null) ||
    catalog.permalink
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  const releaseType = (
    type ?? defaultReleaseType(planned.length)
  ).toUpperCase();
  if (!RELEASE_TYPES.includes(releaseType)) {
    throw new CliError(
      `Invalid --type "${type}". Expected one of: ${RELEASE_TYPES.map((t) => t.toLowerCase()).join(', ')}.`,
    );
  }
  const trackDates = planned
    .map((track) => datePart(track.releaseDate))
    .filter(Boolean)
    .sort();
  const releaseDate =
    date ??
    trackDates[0] ??
    (catalog.set?.year ? `${catalog.set.year}-01-01` : todayIso(now));
  const description = (
    catalog.set?.description ||
    (catalog.kind === 'track' ? first.description : null) ||
    ''
  )
    .trim()
    .slice(0, MAX_RELEASE_DESCRIPTION);
  const genre = mostCommon(planned.map((track) => track.genre));
  return {
    source: catalog.url,
    kind: catalog.kind,
    permalink: catalog.permalink,
    owner,
    title: releaseTitle,
    type: releaseType,
    releaseDate,
    description: description || null,
    genre: genre ? genre.slice(0, MAX_GENRE) : null,
    coverUrl: largestCover(
      catalog.set?.coverUrl ??
        own.find((track) => track.coverUrl)?.coverUrl ??
        null,
    ),
    excludedOthers: others,
    tracks: planned,
  };
}

export function releaseCreateBody(plan) {
  const body = {
    title: plan.title,
    type: plan.type,
    releaseDate: plan.releaseDate,
  };
  if (plan.description) {
    body.description = plan.description;
  }
  if (plan.genre) {
    body.genre = plan.genre;
  }
  return body;
}

/** Sound metadata for one planned track (`SoundUploadMetadataSchema`). */
export function soundMetadataFor(track) {
  const metadata = {};
  if (track.genre) {
    metadata.genre = track.genre.slice(0, MAX_GENRE);
  }
  const tags = track.tags?.length
    ? track.tags
    : track.genre
      ? splitHearthisTags(track.genre)
      : [];
  if (tags.length > 0) {
    metadata.tags = tags;
  }
  if (track.bpm && track.bpm >= 40 && track.bpm <= 300) {
    metadata.bpm = track.bpm;
  }
  if (track.description) {
    metadata.description = track.description.slice(0, MAX_SOUND_DESCRIPTION);
  }
  const released = datePart(track.releaseDate);
  if (released) {
    metadata.releasedAt = `${released}T00:00:00.000Z`;
  }
  return metadata;
}
