import { apiSendJson, CliError } from '../api-client.mjs';
import { fetchLibrarySound } from './library-show.mjs';
import { formatReleaseDetails, formatTracklist } from './releases-show.mjs';

export const RELEASE_TYPES = ['SINGLE', 'EP', 'ALBUM', 'COMPILATION', 'REMIX'];
export const MAX_RELEASE_TRACKS = 50;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function today(now) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseReleaseDate(value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!DATE_PATTERN.test(value) || Number.isNaN(date.getTime())) {
    throw new CliError(`Invalid --date "${value}". Expected YYYY-MM-DD.`);
  }
  return value;
}

export function buildReleaseCreate(title, options = {}, now = new Date()) {
  const trimmedTitle = (title ?? '').trim();
  if (!trimmedTitle) {
    throw new CliError(
      'Missing release title.\nRun `tahti releases create --help` for usage.',
    );
  }
  const type = (options.type ?? 'SINGLE').toUpperCase();
  if (!RELEASE_TYPES.includes(type)) {
    throw new CliError(
      `Invalid --type "${options.type}". Expected one of: ${RELEASE_TYPES.map((t) => t.toLowerCase()).join(', ')}.`,
    );
  }
  const body = {
    title: trimmedTitle,
    type,
    releaseDate: parseReleaseDate(options.date ?? today(now)),
  };
  if (options.description) {
    body.description = options.description;
  }
  if (options.genre?.trim()) {
    body.genre = options.genre.trim();
  }
  return body;
}

async function tracksFromSounds(config, soundIds) {
  if (soundIds.length > MAX_RELEASE_TRACKS) {
    throw new CliError(
      `Too many --sound values: a release holds at most ${MAX_RELEASE_TRACKS} tracks.`,
    );
  }
  const tracks = [];
  for (const soundId of soundIds) {
    const sound = await fetchLibrarySound(config, soundId);
    const track = { title: sound.title, soundId: sound.id };
    const durationSec = Math.round(Number(sound.durationSec));
    if (durationSec > 0) {
      track.durationSec = durationSec;
    }
    tracks.push(track);
  }
  return tracks;
}

export async function runReleasesCreate(config, title, options = {}) {
  const body = buildReleaseCreate(title, options);
  const tracks = await tracksFromSounds(config, options.sound ?? []);
  if (tracks.length > 0) {
    body.tracks = tracks;
  }
  const release = await apiSendJson('POST', '/api/me/releases', body, config);
  if (options.json) {
    return JSON.stringify(release, null, 2);
  }
  const details = formatReleaseDetails(release);
  const created = `Created "${release.title}" (${release.id}) as a draft.`;
  const releaseTracks = release.tracks ?? [];
  if (releaseTracks.length === 0) {
    return `${created}\n\n${details}\n\nNo tracks yet.`;
  }
  return `${created}\n\n${details}\n\n${formatTracklist(releaseTracks)}`;
}
